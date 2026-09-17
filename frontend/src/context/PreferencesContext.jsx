import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAppCurrency,
  getAppTimezone,
  getAppDateFormat,
  formatPrice as utilFormatPrice,
  formatDate as utilFormatDate,
  formatTime as utilFormatTime,
  formatDateTime as utilFormatDateTime,
  JOD_TO_USD_RATE
} from '../utils/formatUtils';

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [currency, setCurrencyState] = useState(getAppCurrency());
  const [timezone, setTimezoneState] = useState(getAppTimezone());
  const [dateFormat, setDateFormatState] = useState(getAppDateFormat());

  const updatePreferences = (newPrefs = {}) => {
    if (newPrefs.currency) {
      localStorage.setItem('app_currency', newPrefs.currency);
      setCurrencyState(newPrefs.currency);
    }
    if (newPrefs.timezone) {
      localStorage.setItem('app_timezone', newPrefs.timezone);
      setTimezoneState(newPrefs.timezone);
    }
    if (newPrefs.dateFormat) {
      localStorage.setItem('app_date_format', newPrefs.dateFormat);
      setDateFormatState(newPrefs.dateFormat);
    }

    // Broadcast change to other windows / tabs
    window.dispatchEvent(new Event('app_preferences_changed'));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrencyState(getAppCurrency());
      setTimezoneState(getAppTimezone());
      setDateFormatState(getAppDateFormat());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app_preferences_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app_preferences_changed', handleStorageChange);
    };
  }, []);

  const formatPrice = (amountInJod, overrideCurrency) => {
    return utilFormatPrice(amountInJod, overrideCurrency || currency);
  };

  const formatDate = (dateInput, overrideFormat, overrideTz) => {
    return utilFormatDate(dateInput, overrideFormat || dateFormat, overrideTz || timezone);
  };

  const formatTime = (dateInput, overrideTz) => {
    return utilFormatTime(dateInput, overrideTz || timezone);
  };

  const formatDateTime = (dateInput, overrideFormat, overrideTz) => {
    return utilFormatDateTime(dateInput, overrideFormat || dateFormat, overrideTz || timezone);
  };

  return (
    <PreferencesContext.Provider
      value={{
        currency,
        timezone,
        dateFormat,
        exchangeRate: JOD_TO_USD_RATE,
        setCurrency: (val) => updatePreferences({ currency: val }),
        setTimezone: (val) => updatePreferences({ timezone: val }),
        setDateFormat: (val) => updatePreferences({ dateFormat: val }),
        updatePreferences,
        formatPrice,
        formatDate,
        formatTime,
        formatDateTime
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      currency: getAppCurrency(),
      timezone: getAppTimezone(),
      dateFormat: getAppDateFormat(),
      exchangeRate: JOD_TO_USD_RATE,
      formatPrice: utilFormatPrice,
      formatDate: utilFormatDate,
      formatTime: utilFormatTime,
      formatDateTime: utilFormatDateTime,
      updatePreferences: () => {}
    };
  }
  return ctx;
}
