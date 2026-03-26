"""
Handlers para ciclo de vida: Finalización y guardado de historia.
Interacción con Telegram y contexto del flujo.
"""
import asyncio
import logging
import sys
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from telegram.constants import ParseMode
from telegram.error import BadRequest
from common import texts
from common.helpers import escape_html
from database import preconsulta_db
from ..services.history_saver import build_history_data
from utils.role_manager import RoleManager
from config import DB_PATH
from utils.sync_service import sync_to_webapp

logger = logging.getLogger(__name__)
role_manager = RoleManager(DB_PATH)

async def check_if_pregnant_for_fertility(update: Update, context: ContextTypes.DEFAULT_TYPE, node: dict):
    from ...patient_flow.generic_flow_engine import render_node
    is_sexually_active = context.user_data.get('sexually_active', '').lower() == 'sí'
    is_prenatal_consultation = context.user_data.get('consultation_type') == 'Prenatal'
    if is_sexually_active and not is_prenatal_consultation:
        return await render_node(update, context, node['next_if_ask_fertility'])
    else:
        return await render_node(update, context, node['next_if_skip_fertility'])

async def finish_preconsultation(update: Update, context: ContextTypes.DEFAULT_TYPE, node: dict):
    user_data = context.user_data
    chat_id = update.effective_chat.id
    user_id = update.effective_user.id
    doctor_id = user_data.get('doctor_id')
    
    print(f"\n[DEBUG LOUD] finish_preconsultation START for user {user_id}", file=sys.stderr, flush=True)
    logger.critical(f"CRITICAL DEBUG: finish_preconsultation START for user {user_id}")
    
    if not doctor_id:
        logger.error(f"No se encontró doctor_id en user_data para el usuario {user_id}")
        return ConversationHandler.END

    history_data = build_history_data(user_data, user_id, doctor_id)
    print(f"[DEBUG LOUD] history_data built for CI {history_data.get('ci')}", file=sys.stderr, flush=True)

    history_id = await preconsulta_db.save_history(history_data)
    print(f"[DEBUG LOUD] history_id received: {history_id}", file=sys.stderr, flush=True)
    logger.critical(f"CRITICAL DEBUG: history_id={history_id}")

    if history_id:
        print(f"[DEBUG LOUD] INVOKING sync_to_webapp...", file=sys.stderr, flush=True)
        logger.critical(f"CRITICAL DEBUG: INVOKING sync_to_webapp...")
        sync_result = await sync_to_webapp(history_data)
        print(f"[DEBUG LOUD] sync_to_webapp RESULT: {sync_result}", file=sys.stderr, flush=True)
        logger.critical(f"CRITICAL DEBUG: sync_to_webapp RESULT: {sync_result}")

    if anchor_id := user_data.get('anchor_message_id'):
        try:
            await context.bot.delete_message(chat_id=chat_id, message_id=anchor_id)
        except BadRequest:
            pass

    if history_id:
        final_message = await context.bot.send_message(
            chat_id=chat_id,
            text=texts.get_text("preconsulta.end_message"),
            parse_mode=ParseMode.HTML
        )
        await _notify_doctor_preconsulta_completion(context, doctor_id, history_id, user_data)
        await asyncio.sleep(4)
        try:
            await final_message.delete()
        except BadRequest:
            pass
        from features.patient_menu.patient_handler import patient_main_menu
        assigned_doctor = await role_manager.get_assigned_doctor(user_id)
        if assigned_doctor:
            class FakeUpdate:
                def __init__(self, chat_id, effective_user):
                    self.effective_chat = type('obj', (object,), {'id': chat_id})()
                    self.effective_user = effective_user
                    self.message = None
                    self.callback_query = None
            fake_update = FakeUpdate(chat_id, update.effective_user)
            await patient_main_menu(fake_update, context, assigned_doctor[0])
    
    context.user_data.clear()
    print(f"[DEBUG LOUD] finish_preconsultation END", file=sys.stderr, flush=True)
    return "END_CONVERSATION"

async def _notify_doctor_preconsulta_completion(context, doctor_id, history_id, user_data):
    try:
        doctor = await role_manager.get_doctor_by_id(doctor_id)
        if not doctor: return
        doctor_telegram_id = doctor[2]
        if not doctor_telegram_id: return
        patient_name = escape_html(user_data.get('full_name') or "Paciente sin nombre")
        notification_text = (f"🩺 <b>Preconsulta completada</b>\n\n👤 <b>Paciente:</b> {patient_name}\n🆔 <b>ID Historia:</b> #{history_id}\n")
        keyboard = InlineKeyboardMarkup([[InlineKeyboardButton("🗑️ En cuenta", callback_data=f"preconsulta_dismiss_{history_id}")]])
        await context.bot.send_message(chat_id=doctor_telegram_id, text=notification_text, parse_mode=ParseMode.HTML, reply_markup=keyboard)
    except Exception:
        logger.exception("Error al enviar notificación")
