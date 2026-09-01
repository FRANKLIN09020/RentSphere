import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LanguageContext } from './language-context'
import type { AppLanguage } from './language-context'

const STORAGE_KEY = 'rentsphere-language'
const pageTranslations: Record<Exclude<AppLanguage, 'en'>, Record<string, string>> = {
  ta: {
    'Property discovery': 'சொத்து தேடல்', 'Find a place that feels like home': 'வீடு போல உணரக்கூடிய இடத்தைக் கண்டறியுங்கள்',
    'Explore verified rentals, compare available units, and request a visit in minutes.': 'சரிபார்க்கப்பட்ட வாடகைகளை ஆராய்ந்து, கிடைக்கும் அலகுகளை ஒப்பிட்டு, சில நிமிடங்களில் பார்வையிட கோருங்கள்.',
    'Smart visit assistant': 'ஸ்மார்ட் பார்வை உதவியாளர்', 'Search the map or describe a property and preferred time to prepare a visit request.': 'வரைபடத்தில் தேடுங்கள் அல்லது சொத்து மற்றும் விருப்ப நேரத்தை விவரித்து பார்வை கோரிக்கையைத் தயாரியுங்கள்.',
    'Ask the assistant': 'உதவியாளரிடம் கேளுங்கள்', 'Ask assistant': 'உதவியாளரிடம் கேள்', 'Search by property, locality or amenity': 'சொத்து, பகுதி அல்லது வசதியால் தேடுங்கள்',
    City: 'நகரம்', 'All cities': 'அனைத்து நகரங்கள்', 'Property type': 'சொத்து வகை', 'All types': 'அனைத்து வகைகள்', Clear: 'அழி',
    'matching properties': 'பொருந்தும் சொத்துகள்', List: 'பட்டியல்', Map: 'வரைபடம்', 'Property map': 'சொத்து வரைபடம்',
    'Select a marker to choose a property for your visit.': 'பார்வையிட ஒரு சொத்தைத் தேர்ந்தெடுக்க குறியீட்டைத் தேர்வு செய்யவும்.',
    'Book a visit': 'பார்வையை முன்பதிவு செய்க', 'Admin and owner will be notified after submission.': 'சமர்ப்பித்த பிறகு நிர்வாகி மற்றும் உரிமையாளருக்கு அறிவிக்கப்படும்.',
    Property: 'சொத்து', 'Select property': 'சொத்தைத் தேர்ந்தெடுக்கவும்', 'Available unit': 'கிடைக்கும் அலகு', 'Select unit': 'அலகைத் தேர்ந்தெடுக்கவும்',
    'Visiting date': 'பார்வை தேதி', 'Visiting time': 'பார்வை நேரம்', Note: 'குறிப்பு', 'Send booking request': 'முன்பதிவு கோரிக்கையை அனுப்பு',
    'No properties available': 'சொத்துகள் எதுவும் கிடைக்கவில்லை', 'Please check again later.': 'பின்னர் மீண்டும் பார்க்கவும்.', 'Rent starts from': 'வாடகை தொடக்கம்',
    Availability: 'கிடைக்கும் நிலை', 'No units available': 'அலகுகள் கிடைக்கவில்லை', Selected: 'தேர்ந்தெடுக்கப்பட்டது', 'Choose property': 'சொத்தைத் தேர்வு செய்க', available: 'கிடைக்கிறது', properties: 'சொத்துகள்', 'units available': 'அலகுகள் கிடைக்கின்றன', Refreshing: 'புதுப்பிக்கிறது', month: 'மாதம்',
    Apartment: 'குடியிருப்பு', 'Independent House': 'தனி வீடு', Villa: 'வில்லா', Studio: 'ஸ்டுடியோ', 'Pg Room': 'பேயிங் கெஸ்ட் அறை', 'Add latitude and longitude to a property to display it on the interactive map.': 'ஊடாடும் வரைபடத்தில் காட்ட சொத்துக்கு அட்சரேகை மற்றும் தீர்க்கரேகையைச் சேர்க்கவும்.',
    'Try asking': 'இவற்றைக் கேளுங்கள்', 'Show Chennai': 'சென்னையைக் காட்டு', 'Find apartments': 'குடியிருப்புகளைக் கண்டறி', 'Available properties': 'கிடைக்கும் சொத்துகள்', 'Show map': 'வரைபடத்தைக் காட்டு', 'What can I ask?': 'நான் என்ன கேட்கலாம்?', 'Available only': 'கிடைப்பவை மட்டும்', 'Assistant help message': 'நகரம் அல்லது சொத்து வகையால் தேடலாம், கிடைக்கும் சொத்துகளை வரைபடத்தில் பார்க்கலாம் அல்லது சொத்தின் பெயர், தேதி மற்றும் நேரத்தைக் கூறி பார்வையை முன்பதிவு செய்யலாம்.',
  },
  hi: {
    'Property discovery': 'संपत्ति खोज', 'Find a place that feels like home': 'ऐसी जगह खोजें जो घर जैसी लगे',
    'Explore verified rentals, compare available units, and request a visit in minutes.': 'सत्यापित किराये देखें, उपलब्ध इकाइयों की तुलना करें और मिनटों में विज़िट का अनुरोध करें।',
    'Smart visit assistant': 'स्मार्ट विज़िट सहायक', 'Search the map or describe a property and preferred time to prepare a visit request.': 'मानचित्र खोजें या विज़िट अनुरोध के लिए संपत्ति और पसंदीदा समय बताएं।',
    'Ask the assistant': 'सहायक से पूछें', 'Ask assistant': 'सहायक से पूछें', 'Search by property, locality or amenity': 'संपत्ति, स्थान या सुविधा से खोजें',
    City: 'शहर', 'All cities': 'सभी शहर', 'Property type': 'संपत्ति का प्रकार', 'All types': 'सभी प्रकार', Clear: 'हटाएँ',
    'matching properties': 'मेल खाती संपत्तियाँ', List: 'सूची', Map: 'मानचित्र', 'Property map': 'संपत्ति मानचित्र',
    'Select a marker to choose a property for your visit.': 'विज़िट के लिए संपत्ति चुनने हेतु मार्कर चुनें।',
    'Book a visit': 'विज़िट बुक करें', 'Admin and owner will be notified after submission.': 'सबमिट करने के बाद व्यवस्थापक और मालिक को सूचित किया जाएगा।',
    Property: 'संपत्ति', 'Select property': 'संपत्ति चुनें', 'Available unit': 'उपलब्ध इकाई', 'Select unit': 'इकाई चुनें',
    'Visiting date': 'विज़िट की तारीख', 'Visiting time': 'विज़िट का समय', Note: 'नोट', 'Send booking request': 'बुकिंग अनुरोध भेजें',
    'No properties available': 'कोई संपत्ति उपलब्ध नहीं', 'Please check again later.': 'कृपया बाद में फिर देखें।', 'Rent starts from': 'किराया शुरू',
    Availability: 'उपलब्धता', 'No units available': 'कोई इकाई उपलब्ध नहीं', Selected: 'चयनित', 'Choose property': 'संपत्ति चुनें', available: 'उपलब्ध', properties: 'संपत्तियाँ', 'units available': 'इकाइयाँ उपलब्ध', Refreshing: 'अपडेट हो रहा है', month: 'माह',
    Apartment: 'अपार्टमेंट', 'Independent House': 'स्वतंत्र मकान', Villa: 'विला', Studio: 'स्टूडियो', 'Pg Room': 'पीजी कमरा', 'Add latitude and longitude to a property to display it on the interactive map.': 'इंटरैक्टिव मानचित्र पर दिखाने के लिए संपत्ति में अक्षांश और देशांतर जोड़ें।',
    'Try asking': 'ये पूछकर देखें', 'Show Chennai': 'चेन्नई दिखाएँ', 'Find apartments': 'अपार्टमेंट खोजें', 'Available properties': 'उपलब्ध संपत्तियाँ', 'Show map': 'मानचित्र दिखाएँ', 'What can I ask?': 'मैं क्या पूछ सकता हूँ?', 'Available only': 'केवल उपलब्ध', 'Assistant help message': 'आप शहर या संपत्ति के प्रकार से खोज सकते हैं, मानचित्र पर उपलब्ध संपत्तियाँ देख सकते हैं, या संपत्ति का नाम, तारीख और समय बताकर विज़िट बुक कर सकते हैं।',
  },
  kn: {
    'Property discovery': 'ಆಸ್ತಿ ಹುಡುಕಾಟ', 'Find a place that feels like home': 'ಮನೆಯಂತೆ ಭಾಸವಾಗುವ ಸ್ಥಳವನ್ನು ಹುಡುಕಿ',
    'Explore verified rentals, compare available units, and request a visit in minutes.': 'ಪರಿಶೀಲಿಸಿದ ಬಾಡಿಗೆಗಳನ್ನು ನೋಡಿ, ಲಭ್ಯ ಘಟಕಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ನಿಮಿಷಗಳಲ್ಲಿ ಭೇಟಿಗೆ ವಿನಂತಿಸಿ.',
    'Smart visit assistant': 'ಸ್ಮಾರ್ಟ್ ಭೇಟಿ ಸಹಾಯಕ', 'Search the map or describe a property and preferred time to prepare a visit request.': 'ನಕ್ಷೆಯಲ್ಲಿ ಹುಡುಕಿ ಅಥವಾ ಭೇಟಿ ವಿನಂತಿಗಾಗಿ ಆಸ್ತಿ ಮತ್ತು ಆದ್ಯತೆಯ ಸಮಯವನ್ನು ವಿವರಿಸಿ.',
    'Ask the assistant': 'ಸಹಾಯಕರನ್ನು ಕೇಳಿ', 'Ask assistant': 'ಸಹಾಯಕರನ್ನು ಕೇಳಿ', 'Search by property, locality or amenity': 'ಆಸ್ತಿ, ಪ್ರದೇಶ ಅಥವಾ ಸೌಲಭ್ಯದಿಂದ ಹುಡುಕಿ',
    City: 'ನಗರ', 'All cities': 'ಎಲ್ಲಾ ನಗರಗಳು', 'Property type': 'ಆಸ್ತಿ ಪ್ರಕಾರ', 'All types': 'ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು', Clear: 'ತೆರವುಗೊಳಿಸಿ',
    'matching properties': 'ಹೊಂದುವ ಆಸ್ತಿಗಳು', List: 'ಪಟ್ಟಿ', Map: 'ನಕ್ಷೆ', 'Property map': 'ಆಸ್ತಿ ನಕ್ಷೆ',
    'Select a marker to choose a property for your visit.': 'ಭೇಟಿಗಾಗಿ ಆಸ್ತಿಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಗುರುತನ್ನು ಆರಿಸಿ.',
    'Book a visit': 'ಭೇಟಿ ಬುಕ್ ಮಾಡಿ', 'Admin and owner will be notified after submission.': 'ಸಲ್ಲಿಸಿದ ನಂತರ ನಿರ್ವಾಹಕ ಮತ್ತು ಮಾಲೀಕರಿಗೆ ತಿಳಿಸಲಾಗುತ್ತದೆ.',
    Property: 'ಆಸ್ತಿ', 'Select property': 'ಆಸ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', 'Available unit': 'ಲಭ್ಯ ಘಟಕ', 'Select unit': 'ಘಟಕ ಆಯ್ಕೆಮಾಡಿ',
    'Visiting date': 'ಭೇಟಿ ದಿನಾಂಕ', 'Visiting time': 'ಭೇಟಿ ಸಮಯ', Note: 'ಟಿಪ್ಪಣಿ', 'Send booking request': 'ಬುಕಿಂಗ್ ವಿನಂತಿ ಕಳುಹಿಸಿ',
    'No properties available': 'ಯಾವುದೇ ಆಸ್ತಿ ಲಭ್ಯವಿಲ್ಲ', 'Please check again later.': 'ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.', 'Rent starts from': 'ಬಾಡಿಗೆ ಆರಂಭ',
    Availability: 'ಲಭ್ಯತೆ', 'No units available': 'ಯಾವುದೇ ಘಟಕ ಲಭ್ಯವಿಲ್ಲ', Selected: 'ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ', 'Choose property': 'ಆಸ್ತಿ ಆಯ್ಕೆಮಾಡಿ', available: 'ಲಭ್ಯ', properties: 'ಆಸ್ತಿಗಳು', 'units available': 'ಘಟಕಗಳು ಲಭ್ಯ', Refreshing: 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ', month: 'ತಿಂಗಳು',
    Apartment: 'ಅಪಾರ್ಟ್‌ಮೆಂಟ್', 'Independent House': 'ಸ್ವತಂತ್ರ ಮನೆ', Villa: 'ವಿಲ್ಲಾ', Studio: 'ಸ್ಟುಡಿಯೋ', 'Pg Room': 'ಪಿಜಿ ಕೊಠಡಿ', 'Add latitude and longitude to a property to display it on the interactive map.': 'ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆಯಲ್ಲಿ ತೋರಿಸಲು ಆಸ್ತಿಗೆ ಅಕ್ಷಾಂಶ ಮತ್ತು ರೇಖಾಂಶ ಸೇರಿಸಿ.',
    'Try asking': 'ಇವುಗಳನ್ನು ಕೇಳಿ ನೋಡಿ', 'Show Chennai': 'ಚೆನ್ನೈ ತೋರಿಸಿ', 'Find apartments': 'ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಹುಡುಕಿ', 'Available properties': 'ಲಭ್ಯ ಆಸ್ತಿಗಳು', 'Show map': 'ನಕ್ಷೆ ತೋರಿಸಿ', 'What can I ask?': 'ನಾನು ಏನು ಕೇಳಬಹುದು?', 'Available only': 'ಲಭ್ಯವಿರುವವು ಮಾತ್ರ', 'Assistant help message': 'ನಗರ ಅಥವಾ ಆಸ್ತಿ ಪ್ರಕಾರದಿಂದ ಹುಡುಕಬಹುದು, ನಕ್ಷೆಯಲ್ಲಿ ಲಭ್ಯ ಆಸ್ತಿಗಳನ್ನು ನೋಡಬಹುದು ಅಥವಾ ಆಸ್ತಿ ಹೆಸರು, ದಿನಾಂಕ ಮತ್ತು ಸಮಯ ಹೇಳಿ ಭೇಟಿಯನ್ನು ಬುಕ್ ಮಾಡಬಹುದು.',
  },
}
const translations: Record<AppLanguage, Record<string, string>> = {
  en: {},
  ta: { ...pageTranslations.ta,
    Tenant: 'குத்தகையாளர்', Owner: 'உரிமையாளர்', Admin: 'நிர்வாகி', 'Sign out': 'வெளியேறு', 'Users & Roles': 'பயனர்கள் மற்றும் பாத்திரங்கள்', 'Pay Rent & History': 'வாடகை செலுத்தல் மற்றும் வரலாறு', 'Complaints & Maintenance': 'புகார்கள் மற்றும் பராமரிப்பு',
    Dashboard: 'முகப்புப் பலகை', Profile: 'சுயவிவரம்', Account: 'கணக்கு', 'My profile': 'என் சுயவிவரம்', Management: 'மேலாண்மை', Finance: 'நிதி', Operations: 'செயல்பாடுகள்', Platform: 'தளம்', Workflow: 'பணிப்பாய்வு', Main: 'முதன்மை', Booking: 'முன்பதிவு',
    Properties: 'சொத்துகள்', Buildings: 'கட்டிடங்கள்', Units: 'அலகுகள்', Tenants: 'குத்தகையாளர்கள்', Agreements: 'ஒப்பந்தங்கள்', Invoices: 'விலைப்பட்டியல்கள்', Payments: 'கட்டணங்கள்', Complaints: 'புகார்கள்', 'Deposit Disputes': 'வைப்புத் தகராறுகள்', 'Rent Increases': 'வாடகை உயர்வுகள்', Organizations: 'நிறுவனங்கள்', Users: 'பயனர்கள்', Approvals: 'ஒப்புதல்கள்', 'Applications & Approvals': 'விண்ணப்பங்கள் மற்றும் ஒப்புதல்கள்', 'Approval status': 'ஒப்புதல் நிலை', 'Browse Apartments': 'குடியிருப்புகளை உலாவுக',
    Notifications: 'அறிவிப்புகள்', 'Mark all read': 'அனைத்தையும் படித்ததாகக் குறி', "You're all caught up.": 'புதிய அறிவிப்புகள் இல்லை.', 'Change language': 'மொழியை மாற்று', 'Switch to light mode': 'ஒளி பயன்முறைக்கு மாற்று', 'Switch to dark mode': 'இருள் பயன்முறைக்கு மாற்று', Logout: 'வெளியேறு', 'System online': 'கணினி இயங்குகிறது', 'Connected to RentSphere API': 'RentSphere API உடன் இணைக்கப்பட்டது', 'Back to Dashboard': 'முகப்புப் பலகைக்கு திரும்பு', 'Smart property management platform': 'சிறந்த சொத்து மேலாண்மை தளம்',
  },
  hi: { ...pageTranslations.hi,
    Tenant: 'किरायेदार', Owner: 'मालिक', Admin: 'व्यवस्थापक', 'Sign out': 'साइन आउट', 'Users & Roles': 'उपयोगकर्ता और भूमिकाएँ', 'Pay Rent & History': 'किराया भुगतान और इतिहास', 'Complaints & Maintenance': 'शिकायतें और रखरखाव',
    Dashboard: 'डैशबोर्ड', Profile: 'प्रोफ़ाइल', Account: 'खाता', 'My profile': 'मेरी प्रोफ़ाइल', Management: 'प्रबंधन', Finance: 'वित्त', Operations: 'संचालन', Platform: 'प्लेटफ़ॉर्म', Workflow: 'कार्यप्रवाह', Main: 'मुख्य', Booking: 'बुकिंग',
    Properties: 'संपत्तियाँ', Buildings: 'इमारतें', Units: 'इकाइयाँ', Tenants: 'किरायेदार', Agreements: 'अनुबंध', Invoices: 'चालान', Payments: 'भुगतान', Complaints: 'शिकायतें', 'Deposit Disputes': 'जमा विवाद', 'Rent Increases': 'किराया वृद्धि', Organizations: 'संगठन', Users: 'उपयोगकर्ता', Approvals: 'स्वीकृतियाँ', 'Applications & Approvals': 'आवेदन और स्वीकृतियाँ', 'Approval status': 'स्वीकृति स्थिति', 'Browse Apartments': 'अपार्टमेंट देखें',
    Notifications: 'सूचनाएँ', 'Mark all read': 'सभी को पढ़ा चिह्नित करें', "You're all caught up.": 'कोई नई सूचना नहीं है।', 'Change language': 'भाषा बदलें', 'Switch to light mode': 'लाइट मोड चुनें', 'Switch to dark mode': 'डार्क मोड चुनें', Logout: 'लॉग आउट', 'System online': 'सिस्टम ऑनलाइन', 'Connected to RentSphere API': 'RentSphere API से जुड़ा है', 'Back to Dashboard': 'डैशबोर्ड पर वापस जाएँ', 'Smart property management platform': 'स्मार्ट संपत्ति प्रबंधन मंच',
  },
  kn: { ...pageTranslations.kn,
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
