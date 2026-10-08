// i18n keys for js/views/home.js and js/views/doctors.js
if (typeof I18n !== 'undefined' && I18n.add) {
  I18n.add('en', {
    services: 'Services',
    hospitals: 'Hospitals',
    nearMe: 'Near me',
    noHospitalsFound: 'No hospitals found',
    doctorsCount: '{{n}} doctors',
    distanceKm: '{{km}} km',
    searchHospitals: 'Search hospitals...',
    nearMeLoading: 'Locating...',
    showAll: 'Show All',
    viewHospital: 'View Hospital',
    tryDifferentSearch: 'Try a different search term or browse all available doctors.',
  });
  I18n.add('am', {
    services: 'አገልግሎቶች',
    hospitals: 'ሆስፒታሎች',
    nearMe: 'በአቅራቢያ',
    noHospitalsFound: 'ምንም ሆስፒታል አልተገኘም',
    doctorsCount: '{{n}} ዶክተሮች',
    distanceKm: '{{km}} ኪሜ',
    searchHospitals: 'ሆስፒታሎችን ይፈልጉ...',
    nearMeLoading: 'በመፈለግ ው...',
    showAll: 'ሁሉንም አሳይ',
    viewHospital: 'ሆስፒታል ይመልከቱ',
    tryDifferentSearch: 'ሌላ ፍለጋ ወይም ሁሉንም ዶክተሮች ይመልከቱ።',
  });
  I18n.add('om', {
    services: 'Tajaajila',
    hospitals: 'Hospitaalota',
    nearMe: 'Naa dhihoo',
    noHospitalsFound: 'Hospitaalni hin argamne',
    doctorsCount: 'Ogeeyyii {{n}}',
    distanceKm: '{{km}} km',
    searchHospitals: 'Hospitaalota barbaadi...',
    nearMeLoading: 'Barbaadaa jira...',
    showAll: 'Hunda agarsiisi',
    viewHospital: 'Hospitaalaa ilaali',
    tryDifferentSearch: 'Maqaa biroo yaali ykn ogeeyyii hunda ilaali.',
  });
}
