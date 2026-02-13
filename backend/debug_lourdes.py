
import asyncio
import os
import sys
from datetime import datetime, date, timedelta
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import app modules
sys.path.append('/app')

from app.core.config import settings
from app.models.cycle_user import CycleUser
from app.models.cycle_period import CyclePeriod
from app.models.cycle_notification_settings import CycleNotificationSettings
from app.models.cycle_notification_history import CycleNotificationHistory
from app.services.cycle_notification_service import CycleNotificationService

async def debug_lourdes():
    # Database connection
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        print(f"\n--- DEBUGGING USER: LOURDES ({datetime.now()}) ---")
        
        # 1. Find User
        stmt = select(CycleUser).where(CycleUser.first_name.ilike('%lourdes%'))
        result = await session.execute(stmt)
        users = result.scalars().all()
        
        if not users:
            print("❌ No user found with name 'Lourdes'")
            return

        for user in users:
            print(f"\n👤 ID: {user.id} | Name: {user.first_name} {user.last_name} | Email: {user.email}")
            
            # 2. Check Push Subscription
            has_sub = "✅ Yes" if user.push_subscription else "❌ No (JSON field)"
            print(f"📱 Push Subscription (User Model): {has_sub}")
            
            # Check push_subscriptions table
            from app.models.push_subscription import PushSubscription
            stmt_sub = select(PushSubscription).where(PushSubscription.user_id == user.id)
            subs = (await session.execute(stmt_sub)).scalars().all()
            print(f"📱 Push Subscriptions (Table): {len(subs)} devices")
            for sub in subs:
                print(f"   - Device: {sub.user_agent[:30]}... | Created: {sub.created_at}")

            # 3. Check Settings
            stmt_settings = select(CycleNotificationSettings).where(CycleNotificationSettings.user_id == user.id)
            settings_obj = (await session.execute(stmt_settings)).scalar_one_or_none()
            
            if settings_obj:
                print("\n⚙️  Notification Settings:")
                print(f"   - Enabled: {settings_obj.notifications_enabled}")
                print(f"   - Time: {settings_obj.notification_time}")
                print(f"   - Method: {settings_obj.rhythm_method}")
                print(f"   - Period Start Alert: {settings_obj.period_start_alert}")
                print(f"   - Period Late Alert: {settings_obj.period_late_alert}")
            else:
                print("❌ No notification settings found!")

            # 4. Check Cycle Status
            stmt_period = select(CyclePeriod).where(
                CyclePeriod.user_id == user.id,
                CyclePeriod.deleted_at.is_(None)
            ).order_by(desc(CyclePeriod.start_date)).limit(1)
            last_period = (await session.execute(stmt_period)).scalar_one_or_none()
            
            today = date.today()
            if last_period:
                print(f"\n🩸 Last Period: {last_period.start_date} (Day { (today - last_period.start_date).days + 1 })")
                if last_period.end_date:
                    print(f"   - Ended: {last_period.end_date}")
                else:
                    print("   - Currently active?")
            else:
                print("\n🩸 No period history found.")

            # 5. Check Notification History
            stmt_hist = select(CycleNotificationHistory).where(
                CycleNotificationHistory.user_id == user.id
            ).order_by(desc(CycleNotificationHistory.sent_at)).limit(5)
            history = (await session.execute(stmt_hist)).scalars().all()
            
            print("\n📜 Recent Notification History:")
            if history:
                for h in history:
                    print(f"   - {h.sent_at.strftime('%Y-%m-%d %H:%M')} | Type: {h.notification_type} | Status: {h.status}")
            else:
                print("   (No history found)")

            # 6. Simulate Notification Check
            print("\n🤖 Simulating Notification Check...")
            service = CycleNotificationService(session)
            # Fetch full user with settings
            user_full = await service._get_user_with_settings(user.id)
            if user_full:
                 # Manually trigger logic check (simplified)
                 # Note: This is an approximation of what the task does
                 print("   (Running logic simulation disabled to avoid side effects)")
                 pass

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_lourdes())
