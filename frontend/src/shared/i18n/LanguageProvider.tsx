import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LanguageContext } from './language-context'
import type { AppLanguage } from './language-context'

const STORAGE_KEY = 'rentsphere-language'
const translations: Record<AppLanguage, Record<string, string>> = {
  en: {},
  ta: {
    Tenant: 'குத்தகையாளர்', Owner: 'உரிமையாளர்', Admin: 'நிர்வாகி', 'Sign out': 'வெளியேறு', 'Users & Roles': 'பயனர்கள் மற்றும் பாத்திரங்கள்', 'Pay Rent & History': 'வாடகை செலுத்தல் மற்றும் வரலாறு', 'Complaints & Maintenance': 'புகார்கள் மற்றும் பராமரிப்பு',
    Dashboard: 'முகப்புப் பலகை', Profile: 'சுயவிவரம்', Account: 'கணக்கு', 'My profile': 'என் சுயவிவரம்', Management: 'மேலாண்மை', Finance: 'நிதி', Operations: 'செயல்பாடுகள்', Platform: 'தளம்', Workflow: 'பணிப்பாய்வு', Main: 'முதன்மை', Booking: 'முன்பதிவு',
    Properties: 'சொத்துகள்', Buildings: 'கட்டிடங்கள்', Units: 'அலகுகள்', Tenants: 'குத்தகையாளர்கள்', Agreements: 'ஒப்பந்தங்கள்', Invoices: 'விலைப்பட்டியல்கள்', Payments: 'கட்டணங்கள்', Complaints: 'புகார்கள்', 'Deposit Disputes': 'வைப்புத் தகராறுகள்', 'Rent Increases': 'வாடகை உயர்வுகள்', Organizations: 'நிறுவனங்கள்', Users: 'பயனர்கள்', Approvals: 'ஒப்புதல்கள்', 'Applications & Approvals': 'விண்ணப்பங்கள் மற்றும் ஒப்புதல்கள்', 'Approval status': 'ஒப்புதல் நிலை', 'Browse Apartments': 'குடியிருப்புகளை உலாவுக',
    Notifications: 'அறிவிப்புகள்', 'Mark all read': 'அனைத்தையும் படித்ததாகக் குறி', "You're all caught up.": 'புதிய அறிவிப்புகள் இல்லை.', 'Change language': 'மொழியை மாற்று', 'Switch to light mode': 'ஒளி பயன்முறைக்கு மாற்று', 'Switch to dark mode': 'இருள் பயன்முறைக்கு மாற்று', Logout: 'வெளியேறு', 'System online': 'கணினி இயங்குகிறது', 'Connected to RentSphere API': 'RentSphere API உடன் இணைக்கப்பட்டது', 'Back to Dashboard': 'முகப்புப் பலகைக்கு திரும்பு', 'Smart property management platform': 'சிறந்த சொத்து மேலாண்மை தளம்',
  },
  hi: {
    Tenant: 'किरायेदार', Owner: 'मालिक', Admin: 'व्यवस्थापक', 'Sign out': 'साइन आउट', 'Users & Roles': 'उपयोगकर्ता और भूमिकाएँ', 'Pay Rent & History': 'किराया भुगतान और इतिहास', 'Complaints & Maintenance': 'शिकायतें और रखरखाव',
    Dashboard: 'डैशबोर्ड', Profile: 'प्रोफ़ाइल', Account: 'खाता', 'My profile': 'मेरी प्रोफ़ाइल', Management: 'प्रबंधन', Finance: 'वित्त', Operations: 'संचालन', Platform: 'प्लेटफ़ॉर्म', Workflow: 'कार्यप्रवाह', Main: 'मुख्य', Booking: 'बुकिंग',
    Properties: 'संपत्तियाँ', Buildings: 'इमारतें', Units: 'इकाइयाँ', Tenants: 'किरायेदार', Agreements: 'अनुबंध', Invoices: 'चालान', Payments: 'भुगतान', Complaints: 'शिकायतें', 'Deposit Disputes': 'जमा विवाद', 'Rent Increases': 'किराया वृद्धि', Organizations: 'संगठन', Users: 'उपयोगकर्ता', Approvals: 'स्वीकृतियाँ', 'Applications & Approvals': 'आवेदन और स्वीकृतियाँ', 'Approval status': 'स्वीकृति स्थिति', 'Browse Apartments': 'अपार्टमेंट देखें',
    Notifications: 'सूचनाएँ', 'Mark all read': 'सभी को पढ़ा चिह्नित करें', "You're all caught up.": 'कोई नई सूचना नहीं है।', 'Change language': 'भाषा बदलें', 'Switch to light mode': 'लाइट मोड चुनें', 'Switch to dark mode': 'डार्क मोड चुनें', Logout: 'लॉग आउट', 'System online': 'सिस्टम ऑनलाइन', 'Connected to RentSphere API': 'RentSphere API से जुड़ा है', 'Back to Dashboard': 'डैशबोर्ड पर वापस जाएँ', 'Smart property management platform': 'स्मार्ट संपत्ति प्रबंधन मंच',
  },
  kn: {
    Tenant: 'ಬಾಡಿಗೆದಾರ', Owner: 'ಮಾಲೀಕ', Admin: 'ನಿರ್ವಾಹಕ', 'Sign out': 'ಸೈನ್ ಔಟ್', 'Users & Roles': 'ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು', 'Pay Rent & History': 'ಬಾಡಿಗೆ ಪಾವತಿ ಮತ್ತು ಇತಿಹಾಸ', 'Complaints & Maintenance': 'ದೂರುಗಳು ಮತ್ತು ನಿರ್ವಹಣೆ',
    Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', Profile: 'ಪ್ರೊಫೈಲ್', Account: 'ಖಾತೆ', 'My profile': 'ನನ್ನ ಪ್ರೊಫೈಲ್', Management: 'ನಿರ್ವಹಣೆ', Finance: 'ಹಣಕಾಸು', Operations: 'ಕಾರ್ಯಾಚರಣೆಗಳು', Platform: 'ವೇದಿಕೆ', Workflow: 'ಕಾರ್ಯಪ್ರವಾಹ', Main: 'ಮುಖ್ಯ', Booking: 'ಬುಕಿಂಗ್',
    Properties: 'ಆಸ್ತಿಗಳು', Buildings: 'ಕಟ್ಟಡಗಳು', Units: 'ಘಟಕಗಳು', Tenants: 'ಬಾಡಿಗೆದಾರರು', Agreements: 'ಒಪ್ಪಂದಗಳು', Invoices: 'ಇನ್‌ವಾಯ್ಸ್‌ಗಳು', Payments: 'ಪಾವತಿಗಳು', Complaints: 'ದೂರುಗಳು', 'Deposit Disputes': 'ಠೇವಣಿ ವಿವಾದಗಳು', 'Rent Increases': 'ಬಾಡಿಗೆ ಹೆಚ್ಚಳ', Organizations: 'ಸಂಸ್ಥೆಗಳು', Users: 'ಬಳಕೆದಾರರು', Approvals: 'ಅನುಮೋದನೆಗಳು', 'Applications & Approvals': 'ಅರ್ಜಿಗಳು ಮತ್ತು ಅನುಮೋದನೆಗಳು', 'Approval status': 'ಅನುಮೋದನೆ ಸ್ಥಿತಿ', 'Browse Apartments': 'ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    Notifications: 'ಅಧಿಸೂಚನೆಗಳು', 'Mark all read': 'ಎಲ್ಲವನ್ನೂ ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ', "You're all caught up.": 'ಹೊಸ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.', 'Change language': 'ಭಾಷೆ ಬದಲಿಸಿ', 'Switch to light mode': 'ಲೈಟ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ', 'Switch to dark mode': 'ಡಾರ್ಕ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ', Logout: 'ಲಾಗ್ ಔಟ್', 'System online': 'ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್', 'Connected to RentSphere API': 'RentSphere API ಸಂಪರ್ಕಗೊಂಡಿದೆ', 'Back to Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ', 'Smart property management platform': 'ಸ್ಮಾರ್ಟ್ ಆಸ್ತಿ ನಿರ್ವಹಣಾ ವೇದಿಕೆ',
  },
}

function initialLanguage(): AppLanguage {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'ta' || saved === 'hi' || saved === 'kn' ? saved : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, language); document.documentElement.lang = language }, [language])
  const t = useCallback((text: string) => translations[language][text] ?? text, [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
