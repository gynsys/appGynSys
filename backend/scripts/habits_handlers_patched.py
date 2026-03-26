# features/preconsulta/habits_handlers.py

import asyncio
import logging
import json
import sys
import aiosqlite
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from telegram.constants import ParseMode
from features.preconsulta.components import keyboards
from common.helpers import escape_html
from database import preconsulta_db
from database.user_db import is_user_admin_for_bot
from features.main_menu.keyboards import get_main_menu_keyboard
from features.preconsulta.states import *
from common import texts
from utils.role_manager import RoleManager
from config import DB_PATH
from utils.sync_service import sync_to_webapp

logger = logging.getLogger(__name__)
role_manager = RoleManager(DB_PATH)

async def ask_habits_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Inicia la sección de hábitos de estilo de vida."""
    if update.callback_query:
        await update.callback_query.answer()
    section_title = texts.get_text('preconsulta.section_lifestyle_habits')
    question_text = texts.get_text('preconsulta.ask_smoking')
    full_text = f"{section_title}\n\n{question_text}"
    await context.bot.edit_message_text(
        chat_id=update.effective_chat.id,
        message_id=context.user_data['anchor_message_id'],
        text=full_text,
        reply_markup=keyboards.get_yes_no_keyboard('habits_smoking'),
        parse_mode=ParseMode.HTML
    )
    return AWAITING_HABITS_SMOKING

async def handle_smoking_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data['habits_smoking'] = "Sí" if query.data.endswith('_yes') else "No"
    await query.edit_message_text(
        text=texts.get_text('preconsulta.ask_alcohol'),
        reply_markup=keyboards.get_alcohol_habit_keyboard(),
        parse_mode=ParseMode.HTML
    )
    return AWAITING_HABITS_ALCOHOL

async def handle_alcohol_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    response_map = {
        "habits_alcohol_yes": "Sí",
        "habits_alcohol_no": "No",
        "habits_alcohol_occasional": "Ocasional"
    }
    context.user_data['habits_alcohol'] = response_map.get(query.data, "No especificado")
    return await finish_preconsultation(update, context)

async def finish_preconsultation(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Función final que recopila todo, guarda en la BD y termina la conversación."""
    if update.callback_query:
        await update.callback_query.answer()

    ud = context.user_data
    user = update.effective_user
    doctor_id = ud.get('doctor_id')
    bot_id = None
    
    if doctor_id:
        doctor = await role_manager.get_doctor_by_id(doctor_id)
        if doctor:
            doctor_telegram_id = doctor[2]
            async with aiosqlite.connect(DB_PATH) as conn:
                conn.row_factory = aiosqlite.Row
                cursor = await conn.execute(
                    'SELECT id FROM bots WHERE admin_user_id = ? AND is_active = 1',
                    (doctor_telegram_id,)
                )
                result = await cursor.fetchone()
                if result:
                    bot_id = result['id']
                else:
                    logger.warning(f"No se encontró bot_id para doctor_telegram_id={doctor_telegram_id}")
    
    if not bot_id:
        from common.context_manager import get_tenant_id
        bot_id = await get_tenant_id(update, context)

    if not bot_id:
        bot_id = 1
    
    prenatal_details_json = None
    if 'children_details' in ud:
        prenatal_details_json = json.dumps(ud['children_details'], ensure_ascii=False)

    def to_roman(num):
        if not isinstance(num, int) or not 0 <= num <= 15: return str(num)
        roman_map = {0: '0', 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV'}
        return roman_map.get(num, str(num))

    if ud.get('gyn_ho') == 'Nuligesta':
        gyn_ho_text = "Nuligesta"
    elif 'gyn_gesta' in ud:
        g, p, c, a = ud.get('gyn_gesta', 0), ud.get('gyn_para', 0), ud.get('gyn_cesarean', 0), ud.get('gyn_abortion', 0)
        parts = [f"{to_roman(g)}G"]
        if p > 0: parts.append(f"{to_roman(p)}P")
        if c > 0: parts.append(f"{to_roman(c)}C")
        if a > 0: parts.append(f"{to_roman(a)}A")
        gyn_ho_text = " ".join(parts)
    else:
        gyn_ho_text = "N/A"

    if not doctor_id:
        logger.error("No se encontró doctor_id en user_data.")
        return None
    
    history_data = {
        'doctor_id': doctor_id, 'user_id': user.id,
        'full_name': ud.get('full_name'), 'age': ud.get('age'), 'ci': ud.get('ci'),
        'phone': ud.get('phone'), 'address': ud.get('address'), 'occupation': ud.get('occupation'),
        'family_history_mother': ud.get('family_history_mother'), 'family_history_father': ud.get('family_history_father'),
        'personal_history': ud.get('personal_history'), 'supplements': ud.get('supplements'), 'surgical_history': ud.get('surgical_history'),
        'gyn_menarche': ud.get('gyn_menarche'), 'gyn_ho': gyn_ho_text, 'gyn_cycles': ud.get('gyn_cycles'), 'gyn_fertility_intent': ud.get('gyn_fertility_intent'),
        'gyn_dysmenorrhea': ud.get('gyn_dysmenorrhea'), 'gyn_sexarche': ud.get('gyn_sexarche', 'N/A'),
        'sexually_active': ud.get('sexually_active'), 'gyn_fum': ud.get('gyn_fum'), 'gyn_mac': ud.get('gyn_mac'),
        'gyn_previous_checkups': ud.get('gyn_previous_checkups'), 'gyn_last_pap_smear': ud.get('gyn_last_pap_smear'),
        'leg_pain_type': ud.get('leg_pain_type'), 'leg_pain_zone': ud.get('leg_pain_zone'),
        'sexual_pain_dyspareunia': ud.get('sexual_pain_dyspareunia'), 'sexual_pain_type': ud.get('sexual_pain_type'), 'sexual_pain_scale': ud.get('sexual_pain_scale'),
        'habits_smoking': ud.get('habits_smoking'), 'habits_alcohol': ud.get('habits_alcohol'), 'habits_substance_use': ud.get('habits_substance_use'),
        'gastro_symptoms_before_period': ud.get('gastro_symptoms_before_period'), 'gastro_symptoms_during_period': ud.get('gastro_symptoms_during_period'),
        'bowel_dischezia': ud.get('bowel_dischezia'), 'bowel_dischezia_scale': ud.get('bowel_dischezia_scale'), 'bowel_frequency': ud.get('bowel_frequency'),
        'habits_urinary': ud.get('habits_urinary'), 'urinary_pain_scale': ud.get('urinary_pain_scale'), 'urinary_irritation': ud.get('urinary_irritation'),
        'urinary_incontinence': ud.get('urinary_incontinence'), 'urinary_nocturia': ud.get('urinary_nocturia'),
        'consultation_type': ud.get('consultation_type'), 'reason_for_visit': ud.get('reason_for_visit'), 'prenatal_details': prenatal_details_json
    }

    history_id = None
    try:
        logger.info("Paso 1: Intentando guardar la historia principal en la BD...")
        history_id = await preconsulta_db.save_history(history_data)

        if history_id:
            logger.info(f"Paso 1 - ÉXITO: Historia guardada con ID: {history_id}")
            
            # --- SINCRONIZACIÓN CON APP WEB (PARCHE LOUD) ---
            print(f"\n[DEBUG LOUD] Iniciando sinc para CI {history_data.get('ci')}", file=sys.stderr, flush=True)
            # Mapeo de claves para la App Web (Paridad de nombres)
            history_data["functional_dispareunia"] = history_data.get("sexual_pain_dyspareunia")
            history_data["functional_dischezia"] = history_data.get("bowel_dischezia")
            history_data["functional_dispareunia_deep_scale"] = history_data.get("sexual_pain_scale")
            history_data["functional_dischezia_scale"] = history_data.get("bowel_dischezia_scale")
            
            try:
                sync_result = await sync_to_webapp(history_data)
                print(f"[DEBUG LOUD] Resultado de sinc: {sync_result}", file=sys.stderr, flush=True)
            except Exception as sync_err:
                logger.error(f"Error durante sync_to_webapp: {sync_err}", exc_info=True)

            logger.info("Paso 2: Intentando generar el Número de Historia (NHM)...")
            consult_type = ud.get('consultation_type', 'Ginecológica')
            if not consult_type: consult_type = 'Ginecológica'

            history_number = await preconsulta_db.get_next_history_number(doctor_id, consult_type)
            logger.info(f"Paso 2 - Resultado: NHM generado es '{history_number}'")

            logger.info(f"Paso 3: Intentando guardar el NHM '{history_number}' para el ID {history_id}...")
            success_save_num = await preconsulta_db.save_history_number(history_id, history_number)

            if success_save_num:
                logger.info(f"Paso 3 - ÉXITO: NHM guardado correctamente.")
            else:
                logger.error("Paso 3 - FALLO: save_history_number devolvió False.")
        else:
            logger.error("¡FALLO CRÍTICO! save_history devolvió None. No se puede continuar.")

    except Exception as e:
        logger.error(f"¡EXCEPCIÓN INESPERADA durante el proceso de guardado/NHM!", exc_info=True)

    final_message = texts.get_text('preconsulta.end_message')
    await context.bot.edit_message_text(
        chat_id=user.id,
        message_id=context.user_data['anchor_message_id'],
        text=final_message,
        parse_mode=ParseMode.HTML
    )
    await asyncio.sleep(2.5)

    mensaje_bienvenida = await texts.get_mensaje_bienvenida(nombre_usuario=user.first_name, bot_id=bot_id)
    is_admin = await is_user_admin_for_bot(user.id, bot_id)
    is_superadmin = False
    user_id = user.id

    await context.bot.edit_message_text(
        chat_id=user.id,
        message_id=context.user_data['anchor_message_id'],
        text=mensaje_bienvenida,
        reply_markup=await get_main_menu_keyboard(is_superadmin=is_superadmin, user_id=user_id),
        parse_mode=ParseMode.HTML
    )

    context.user_data.clear()
    return ConversationHandler.END
