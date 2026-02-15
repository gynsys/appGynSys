#logic.py
from datetime import date, timedelta

def calculate_predictions(last_period_start: date, cycle_length: int = 28, period_length: int = 5) -> dict:
    """Calculate menstrual predictions based on last period"""
    today = date.today()
    
    # Calculate cycle day
    days_since_start = (today - last_period_start).days
    cycle_day = (days_since_start % cycle_length) + 1
    
    # Next period
    cycles_passed = days_since_start // cycle_length
    next_period_start = last_period_start + timedelta(days=(cycles_passed + 1) * cycle_length)
    
    # If next period is in the past (shouldn't happen if we strictly follow cycles_passed, but for safety)
    # The logic above: if today is day 29 of 28, cycles_passed=1. next_start = start + 2*28. Correct.
    # If today is day 1, cycles_passed=0. next_start = start + 28. Correct.
    
    if next_period_start <= today:
        # This condition handles cases where we might want to show the 'next' upcoming one if today IS the start date?
        # If today == next_period_start, then it IS the period day.
        # But usually 'next period' implies future.
        # However, for notifications, we want to know if today IS the period start too.
        # Let's keep original logic but verify it.
        # Original: if next_period_start <= today: next = +1 cycle.
        # This implies if today IS the predicted start, it shows the ONE AFTER.
        # That might be bad for "Today is your period" notification.
        # But for "Next period" display text it might be desired.
        # I'll stick to original logic for consistency, but for NOTIFICATIONS I might need to check 'is today the day'.
        pass

    # Re-reading original logic which had this modification:
    if next_period_start <= today:
         next_period_start = last_period_start + timedelta(days=(cycles_passed + 2) * cycle_length)

    next_period_end = next_period_start + timedelta(days=period_length - 1)
    
    # Ovulation (typically 14 days before next period)
    # Note: Logic must calculate ovulation for the UPCOMING period.
    ovulation_date = next_period_start - timedelta(days=14)
    
    # Fertile window (5 days before ovulation + ovulation day)
    fertile_window_start = ovulation_date - timedelta(days=5)
    fertile_window_end = ovulation_date + timedelta(days=1)
    
    # Determine phase
    if cycle_day <= period_length:
        phase = "menstrual"
    elif cycle_day <= cycle_length - 14:
        phase = "follicular"
    elif cycle_day <= cycle_length - 12:
        phase = "ovulation"
    else:
        phase = "luteal"
    
    # Pregnancy probability based on cycle day
    days_to_ovulation = (ovulation_date - today).days
    # Note: this uses the ovulation date of the NEXT period. 
    # If we are in the previous cycle's end, this might be far.
    # But cycles_passed logic aligns next_period to be the current upcoming one.
    
    if -1 <= days_to_ovulation <= 1:
        pregnancy_probability = "high"
    elif -3 <= days_to_ovulation <= 3:
        pregnancy_probability = "medium"
    else:
        pregnancy_probability = "low"
    
    return {
        "next_period_start": next_period_start,
        "next_period_end": next_period_end,
        "ovulation_date": ovulation_date,
        "fertile_window_start": fertile_window_start,
        "fertile_window_end": fertile_window_end,
        "pregnancy_probability": pregnancy_probability,
        "cycle_day": cycle_day,
        "phase": phase
    }
