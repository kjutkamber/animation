/* =========================================================================
       1. CONSTANTS, BACKEND CONFIG & PROFESSORS
       ========================================================================= */
    const LANG_KEY = 'anim_pipeline_portal_v3_lang';

    /* ---- >>> FILL THESE IN (see the Setup screen in the app for the steps) <<< ---- */
    const FIREBASE_CONFIG = {
      apiKey: 'AIzaSyDpVUa_NmU3-jpRwc6kNmwBhm6r3fArqNA',
      authDomain: 'animation-pipeline-7ba67.firebaseapp.com',
      projectId: 'animation-pipeline-7ba67',
      storageBucket: 'animation-pipeline-7ba67.firebasestorage.app',
      messagingSenderId: '52102812827',
      appId: '1:52102812827:web:0a1436e5981424d7e9e23e'
    };
    const GOOGLE_CLIENT_ID = '52102812827-ri8ms7jsbf80jl2acj6b7ujr49cuus7a.apps.googleusercontent.com';
    const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email';

    // TEMPORARY: client-side admin gate for the Settings screen. Move to the backend
    // (custom claim / Cloud Function) before real use — anyone can read these values here.
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin';

    const FIREBASE_READY = typeof firebase !== 'undefined' && !/^YOUR_/.test(FIREBASE_CONFIG.apiKey);

    const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isProf() {
      return signedIn() &&
        get(/databases/$(db)/documents/users/$(request.auth.uid)).data.role == 'professor';
    }
    match /users/{uid} {
      allow read: if signedIn() || resource.data.role == 'professor';
      allow create: if signedIn() && request.auth.uid == uid;      // TEMP: needed so admin screen can create professors
      allow update: if signedIn() && request.auth.uid == uid
                    && request.resource.data.role == resource.data.role;   // role cannot be changed afterwards
      allow delete: if resource.data.role == 'professor';            // TEMP: admin screen
    }
    match /projects/{pid} {
      allow read: if signedIn() && (isProf() || resource.data.studentId == request.auth.uid);
      allow create: if signedIn() && request.resource.data.studentId == request.auth.uid;
      allow update: if signedIn() && (isProf() || resource.data.studentId == request.auth.uid);
      allow delete: if signedIn() && resource.data.studentId == request.auth.uid;
    }
    match /settings/{doc} {
      allow read: if true;
      allow write: if true;                                          // TEMP: admin screen
    }
  }
}`;

    let PROFESSORS = []; // loaded live from Firestore (users where role == 'professor')

    const CATEGORY_PRESETS = {
      PRE: [
        { key: 'catWriting', color: '#22c55e' },
        { key: 'catConcept', color: '#38bdf8' },
        { key: 'catStoryboard', color: '#a855f7' },
        { key: 'catAnimatic', color: '#f59e0b' }
      ],
      PROD: [
        { key: 'catModeling', color: '#6366f1' },
        { key: 'catRigging', color: '#06b6d4' },
        { key: 'catLayout', color: '#ec4899' },
        { key: 'catAnimation', color: '#10b981' },
        { key: 'catLighting', color: '#eab308' },
        { key: 'catRender', color: '#f97316' }
      ],
      POST: [
        { key: 'catCompositing', color: '#a855f7' },
        { key: 'catEditing', color: '#3b82f6' },
        { key: 'catSound', color: '#14b8a6' },
        { key: 'catDelivery', color: '#84cc16' }
      ]
    };

    const TASK_PRESETS = {
      catWriting: ['itemIdea', 'itemLogline', 'itemSynopsis', 'itemScenario'],
      catConcept: ['itemCharDesign', 'itemPropDesign', 'itemSetDesign'],
      catStoryboard: ['itemSbPanels', 'itemSbReview'],
      catAnimatic: ['itemRoughAnimatic', 'itemTimedAnimatic'],
      catModeling: ['itemCharModel', 'itemEnvModel'],
      catRigging: ['itemCharRig', 'itemPropRig'],
      catLayout: ['itemCameras', 'itemBlocking'],
      catAnimation: ['itemKeyAnimation', 'itemSplinePolish'],
      catLighting: ['itemShaders', 'itemSceneLighting'],
      catRender: ['itemRenderPasses', 'itemRenderCheck'],
      catCompositing: ['itemCompLayers', 'itemColorGrade'],
      catEditing: ['itemRoughCut', 'itemFinalCutCredits'],
      catSound: ['itemSfxVoice', 'itemMusicMix'],
      catDelivery: ['itemMasterExport', 'itemArchivePack']
    };

    /* =========================================================================
       2. TRANSLATIONS (SERBIAN DEFAULT + ENGLISH)
       ========================================================================= */
    const I18N = {
      sr: {
        appTitle: 'Animation Production Sheet',
        authSub: 'Radni prostor za studente i profesore',
        studentTab: 'Student',
        professorTab: 'Profesor',
        registerTab: 'Registracija',
        loginTab: 'Prijava',
        firstName: 'Ime *',
        lastName: 'Prezime *',
        indexId: 'Broj indeksa *',
        studyYear: 'Godina studija *',
        yearShort: (y) => `${y}. godina`,
        allYears: 'Sve godine',
        password: 'Lozinka *',
        registerBtn: 'Registruj se i poveži Drive',
        loginBtn: 'Prijavi se',
        profHint: 'Izaberite profil profesora za pregled studenata po godini studija (1–4. godina), zadataka na čekanju i ocenjivanje.',
        openProfileBtn: 'Prijavi se',
        storageInfo: 'Lokalno čuvanje (localStorage)',
        resetDemo: 'Reset Demo Data',
        resetDone: 'Podaci su resetovani.',
        logout: 'Odjavi se',
        gdriveTitle: 'Povežite svoj Google Drive',
        gdriveDesc: (name, idx, yr) => `${name} (${idx}, ${yr}. godina) — povežite Google Drive da biste napravili glavni folder „Animation Pipeline” sa pristupom „Svako ko ima link”.`,
        gdriveEmailLbl: 'Google nalog (email)',
        cancel: 'Otkaži',
        gdriveConnectBtn: 'Napravi „Animation Pipeline” folder',
        gdriveWorking: 'Kreiranje foldera „Animation Pipeline” i podešavanje dozvola...',
        gdriveReady: 'Google Drive povezan — folder „Animation Pipeline” je spreman.',
        navProjects: 'Moji projekti',
        navWorkspace: 'Raspored',
        navProfYears: 'Godine studija',
        projectsHeading: (name, yr) => `${name} — Moji projekti (${yr}. godina)`,
        projectsSub: 'Napravite projekat i otvorite tabelu rasporeda sa fazama, kategorijama i zadacima.',
        newProjectBtn: '+ Napravi projekat',
        npTitle: 'Napravi projekat',
        npName: 'Naziv projekta *',
        npType: 'Vrsta animacije *',
        npLength: 'Trajanje *',
        npStart: 'Datum početka *',
        npEnd: 'Datum završetka *',
        npVis: 'Vidljivost',
        publicLbl: 'Javno',
        privateLbl: 'Privatno',
        createBtn: 'Napravi projekat',
        projectCreated: (path) => `Napravljen projekat i folder: ${path}`,
        openPipelineBtn: 'Otvori raspored',
        approvedProgressLbl: 'Napredak (samo odobreno / gotovo)',
        progressRule: 'U završen napredak ulaze samo zadaci sa statusom „Odobreno / Gotovo”.',
        waitingBadge: (n) => `${n} čeka pregled`,
        gradeLbl: 'Ocena',
        ungraded: 'Bez ocene',
        backToYearBtn: '← Nazad na godinu',
        myProjectsBtn: 'Moji projekti',
        addWeekBtn: '+ Dodaj nedelju',
        weekAdded: 'Dodata je nova nedelja.',
        profNoteTitle: 'Komentar profesora',
        phasePre: 'PRETPRODUKCIJA',
        phaseProd: 'PRODUKCIJA',
        phasePost: 'POSTPRODUKCIJA',
        colPipeline: 'Faza / Kategorija / Zadatak',
        weekLbl: 'Nedelja',
        accountBtn: 'Nalog', accountTitle: 'Podešavanja naloga', langLbl: 'Jezik',
        pwSection: 'Promena lozinke', pwCurrent: 'Trenutna lozinka', pwNew: 'Nova lozinka', pwRepeat: 'Ponovi novu lozinku', pwSave: 'Promeni lozinku',
        pwMismatch: 'Nove lozinke se ne poklapaju.', pwShort: 'Lozinka mora imati bar 6 znakova.', pwChanged: 'Lozinka je promenjena.', pwWrong: 'Trenutna lozinka nije tačna.',
        archiveBtn: 'Arhiviraj', unarchiveBtn: 'Vrati iz arhive', archivedToast: 'Projekat je arhiviran.', unarchivedToast: 'Projekat je vraćen iz arhive.',
        archivedLbl: 'Arhivirano', showArchived: (n) => `Prikaži arhivirane (${n})`, hideArchived: 'Sakrij arhivirane',
        catGradeLbl: 'Ocena', catGradePrompt: 'Ocena za kategoriju (prazno = ukloni):',
        daysSectionLbl: 'Zakazani dani',
        daysNone: 'Nema označenih dana. Klikni na prazno polje u rasporedu.',
        daysClearAll: 'Obriši sve dane',
        dayRemove: 'Ukloni dan',
        dayNames: ['Pon','Uto','Sre','Čet','Pet','Sub','Ned'],
        daysShort: ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'],
        daysFull: ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'],
        scheduledDaysCount: (n) => `${n}d`,
        profDashTitle: 'Pregled studenata po godini studija',
        profDashSub: 'Izaberite godinu studija (1–4. godina), pregledajte zadatke koji čekaju odobrenje i ocenite projekte.',
        queueTitle: 'Čeka se pregled — dodeljeni zadaci',
        openTaskBtn: 'Pregledaj zadatak',
        noStudentsYear: 'Nema registrovanih studenata za izabranu godinu studija.',
        noRegisteredYet: 'Još nema registrovanih studenata.',
        registeredList: (list) => `Registrovani studenti: ${list.join(', ')}`,
        inspectStudentBtn: 'Pregledaj projekat',
        gradeActionBtn: 'Ocena i komentar',
        gmTitle: 'Ocena i komentar profesora',
        gmPre: 'Pretprodukcija',
        gmProd: 'Produkcija',
        gmPost: 'Postprodukcija',
        gmFinal: 'Konačna ocena',
        gmNote: 'Komentar profesora',
        saveGradesBtn: 'Sačuvaj ocene',
        gradesSaved: 'Ocene i komentar su sačuvani.',
        addCatTitle: 'Dodaj kategoriju',
        addTaskTitle: 'Dodaj zadatak',
        presetLbl: 'Predlog',
        customOpt: 'Prilagođeno...',
        colorLbl: 'Boja kategorije',
        nameLbl: 'Naziv *',
        addBtn: 'Dodaj',
        catAdded: 'Kategorija je dodata.',
        taskAdded: 'Zadatak je dodat.',
        statusLbl: 'Status',
        stNotStarted: 'Nije započeto',
        stInProgress: 'U toku',
        stReview: 'Čeka se pregled',
        stApproved: 'Odobreno / Gotovo',
        reviewerLbl: 'Izaberi profesora za pregled',
        approveNowBtn: 'Potvrdi: Odobreno / Gotovo',
        taskApprovedMsg: 'Zadatak je označen kao Odobreno / Gotovo.',
        daysSectionLbl: 'Zakazani dani (kliknite na dan za uključenje/isključenje)',
        addDayBtn: '+1 dan',
        removeDayBtn: '-1 dan',
        mediaSectionLbl: 'Slike i video na Drive-u',
        uploadMediaBtn: '+ Otpremi sliku / video',
        mediaUploaded: 'Fajl je dodat u folder na Drive-u.',
        noMedia: 'Još nema otpremljenih slika ili videa.',
        commentsLbl: 'Komentari',
        noComments: 'Još nema komentara.',
        commentPlaceholder: 'Napišite komentar...',
        postCommentBtn: 'Pošalji komentar',
        toGeneral: 'Opšti komentar',
        toProfQuestion: (n) => `Pitanje za: ${n}`,
        questionFor: (n) => `Pitanje za ${n}`,
        awaitingAnswer: 'Čeka odgovor',
        answeredLbl: 'Odgovoreno',
        replyBtn: 'Odgovori',
        replyingTo: 'Odgovor na pitanje studenta',
        cancelReply: 'Otkaži',
        replyPlaceholder: 'Napišite odgovor...',
        questionPlaceholder: 'Napišite komentar ili pitanje...',
        questionSent: 'Pitanje je poslato profesoru.',
        notifTitle: 'Pitanja od studenata',
        noNotifs: 'Nema novih pitanja.',
        newLbl: 'novo',
        questionsBoxTitle: 'Pitanja od studenata',
        openQBtn: 'Otvori',
        mediaOpenHint: 'Kliknite za prikaz preko celog ekrana',
        replySent: 'Odgovor je poslat.',
        dupIndexErr: 'Student sa ovim brojem indeksa već postoji.',
        loginErr: 'Pogrešan broj indeksa ili lozinka.',
        catWriting: 'Pisanje',
        catConcept: 'Koncept dizajn',
        catStoryboard: 'Storibord',
        catAnimatic: 'Animatik',
        catModeling: 'Modelovanje',
        catRigging: 'Rigovanje',
        catLayout: 'Lejaut',
        catAnimation: 'Animacija',
        catLighting: 'Svetlo i šejding',
        catRender: 'Renderovanje',
        catCompositing: 'Kompoziting',
        catEditing: 'Montaža',
        catSound: 'Dizajn zvuka i miks',
        catDelivery: 'Završna isporuka',
        itemIdea: 'Ideja',
        itemLogline: 'Logline',
        itemSynopsis: 'Sinopsis',
        itemScenario: 'Scenario',
        itemCharDesign: 'Dizajn likova',
        itemPropDesign: 'Dizajn rekvizita',
        itemSetDesign: 'Dizajn scenografije',
        itemSbPanels: 'Storibord kadrovi',
        itemSbReview: 'Provera storiborda',
        itemRoughAnimatic: 'Grubi animatik',
        itemTimedAnimatic: 'Animatik sa tajmingom i zvukom',
        itemCharModel: 'Modelovanje likova',
        itemEnvModel: 'Modelovanje scena i rekvizita',
        itemCharRig: 'Rigovanje likova',
        itemPropRig: 'Rigovanje rekvizita',
        itemCameras: 'Postavka kamera (Lejaut)',
        itemBlocking: 'Blokiranje kadrova',
        itemKeyAnimation: 'Ključna animacija',
        itemSplinePolish: 'Doterivanje animacije',
        itemShaders: 'Šejderi i teksture',
        itemSceneLighting: 'Osvetljenje scene',
        itemRenderPasses: 'Render prolazi',
        itemRenderCheck: 'Provera rendera',
        itemCompLayers: 'Kompoziting slojevi',
        itemColorGrade: 'Kolor grejding',
        itemRoughCut: 'Radna montaža',
        itemFinalCutCredits: 'Završna montaža i špica',
        itemSfxVoice: 'Glasovi, SFX i foli',
        itemMusicMix: 'Muzika i miks',
        itemMasterExport: 'Master video eksport',
        itemArchivePack: 'Arhiva projekta'
      },
      en: {
        appTitle: 'Animation Production Sheet',
        authSub: 'Workspace for students and professors',
        studentTab: 'Student',
        professorTab: 'Professor',
        registerTab: 'Register',
        loginTab: 'Login',
        firstName: 'First Name *',
        lastName: 'Last Name *',
        indexId: 'Index ID *',
        studyYear: 'Study Year *',
        yearShort: (y) => `Year ${y}`,
        allYears: 'All Years',
        password: 'Password *',
        registerBtn: 'Register & Connect Drive',
        loginBtn: 'Sign In',
        profHint: 'Choose a professor profile to browse students by study year (1–4), review pending approvals, and grade.',
        openProfileBtn: 'Sign In',
        storageInfo: 'Local browser storage (localStorage)',
        resetDemo: 'Reset Demo Data',
        resetDone: 'Data reset.',
        logout: 'Log Out',
        gdriveTitle: 'Connect Your Google Drive',
        gdriveDesc: (name, idx, yr) => `${name} (${idx}, Year ${yr}) — connect Google Drive to create the root folder "Animation Pipeline" with "Anyone with the link" access.`,
        gdriveEmailLbl: 'Google Account (email)',
        cancel: 'Cancel',
        gdriveConnectBtn: 'Create "Animation Pipeline" Folder',
        gdriveWorking: 'Creating "Animation Pipeline" folder and setting sharing permissions...',
        gdriveReady: 'Google Drive connected — "Animation Pipeline" folder ready.',
        navProjects: 'My Projects',
        navWorkspace: 'Pipeline',
        navProfYears: 'Study Years',
        projectsHeading: (name, yr) => `${name} — My Projects (Year ${yr})`,
        projectsSub: 'Create a project and open its timeline with phases, categories, and tasks.',
        newProjectBtn: '+ New Project',
        npTitle: 'Create Project',
        npName: 'Project Name *',
        npType: 'Animation Type *',
        npLength: 'Length *',
        npStart: 'Start Date *',
        npEnd: 'End Date *',
        npVis: 'Visibility',
        publicLbl: 'Public',
        privateLbl: 'Private',
        createBtn: 'Create Project',
        projectCreated: (path) => `Created project & folder: ${path}`,
        openPipelineBtn: 'Open Pipeline',
        approvedProgressLbl: 'Progress (Approved / Done only)',
        progressRule: 'Only tasks marked "Approved / Done" count toward completed progress.',
        waitingBadge: (n) => `${n} waiting for approval`,
        gradeLbl: 'Grade',
        ungraded: 'Ungraded',
        backToYearBtn: '← Back to Year',
        myProjectsBtn: 'My Projects',
        addWeekBtn: '+ Add Week',
        weekAdded: 'Added a new week.',
        profNoteTitle: 'Professor Note',
        phasePre: 'PRE-PRODUCTION',
        phaseProd: 'PRODUCTION',
        phasePost: 'POST-PRODUCTION',
        colPipeline: 'Phase / Category / Task',
        weekLbl: 'Week',
        accountBtn: 'Account', accountTitle: 'Account settings', langLbl: 'Language',
        pwSection: 'Change password', pwCurrent: 'Current password', pwNew: 'New password', pwRepeat: 'Repeat new password', pwSave: 'Change password',
        pwMismatch: 'New passwords do not match.', pwShort: 'Password must be at least 6 characters.', pwChanged: 'Password changed.', pwWrong: 'Current password is incorrect.',
        archiveBtn: 'Archive', unarchiveBtn: 'Restore from archive', archivedToast: 'Project archived.', unarchivedToast: 'Project restored.',
        archivedLbl: 'Archived', showArchived: (n) => `Show archived (${n})`, hideArchived: 'Hide archived',
        catGradeLbl: 'Grade', catGradePrompt: 'Category grade (empty = remove):',
        daysSectionLbl: 'Scheduled days',
        daysNone: 'No days marked. Click an empty cell on the schedule.',
        daysClearAll: 'Clear all days',
        dayRemove: 'Remove day',
        dayNames: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        daysFull: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        scheduledDaysCount: (n) => `${n}d`,
        profDashTitle: 'Students by Study Year',
        profDashSub: 'Select a study year (1–4), review tasks waiting for approval, and grade projects.',
        queueTitle: 'Waiting for Approval — Assigned Queue',
        openTaskBtn: 'Review Task',
        noStudentsYear: 'No students registered for this study year yet.',
        noRegisteredYet: 'No student accounts registered yet.',
        registeredList: (list) => `Registered students: ${list.join(', ')}`,
        inspectStudentBtn: 'Inspect Project',
        gradeActionBtn: 'Grade & Note',
        gmTitle: 'Professor Grade & Note',
        gmPre: 'Pre-Production',
        gmProd: 'Production',
        gmPost: 'Post-Production',
        gmFinal: 'Final Grade',
        gmNote: 'Professor Comment',
        saveGradesBtn: 'Save Grades',
        gradesSaved: 'Grades and comment saved.',
        addCatTitle: 'Add Category',
        addTaskTitle: 'Add Task',
        presetLbl: 'Preset',
        customOpt: 'Custom...',
        colorLbl: 'Category Color',
        nameLbl: 'Name *',
        addBtn: 'Add',
        catAdded: 'Category added.',
        taskAdded: 'Task added.',
        statusLbl: 'Status',
        stNotStarted: 'Not Started',
        stInProgress: 'In Progress',
        stReview: 'Waiting for Approval',
        stApproved: 'Approved / Done',
        reviewerLbl: 'Select Professor for Review',
        approveNowBtn: 'Confirm: Approved / Done',
        taskApprovedMsg: 'Task marked as Approved / Done.',
        daysSectionLbl: 'Scheduled Days (click a day to toggle)',
        addDayBtn: '+1 Day',
        removeDayBtn: '-1 Day',
        mediaSectionLbl: 'Images & Videos on Drive',
        uploadMediaBtn: '+ Upload Image / Video',
        mediaUploaded: 'File added to project folder on Drive.',
        noMedia: 'No images or videos uploaded yet.',
        commentsLbl: 'Comments',
        noComments: 'No comments yet.',
        commentPlaceholder: 'Write a comment...',
        postCommentBtn: 'Post Comment',
        toGeneral: 'General comment',
        toProfQuestion: (n) => `Question for: ${n}`,
        questionFor: (n) => `Question for ${n}`,
        awaitingAnswer: 'Awaiting answer',
        answeredLbl: 'Answered',
        replyBtn: 'Reply',
        replyingTo: 'Replying to student question',
        cancelReply: 'Cancel',
        replyPlaceholder: 'Write a reply...',
        questionPlaceholder: 'Write a comment or question...',
        questionSent: 'Question sent to professor.',
        notifTitle: 'Student questions',
        noNotifs: 'No new questions.',
        newLbl: 'new',
        questionsBoxTitle: 'Student questions',
        openQBtn: 'Open',
        mediaOpenHint: 'Click to view fullscreen',
        replySent: 'Reply sent.',
        dupIndexErr: 'A student with this Index ID already exists.',
        loginErr: 'Invalid Index ID or password.',
        catWriting: 'Writing',
        catConcept: 'Concept Design',
        catStoryboard: 'Storyboard',
        catAnimatic: 'Animatic',
        catModeling: 'Modeling',
        catRigging: 'Rigging',
        catLayout: 'Layout',
        catAnimation: 'Animation',
        catLighting: 'Lighting & Shading',
        catRender: 'Render',
        catCompositing: 'Compositing',
        catEditing: 'Editing',
        catSound: 'Sound Design & Mix',
        catDelivery: 'Final Delivery',
        itemIdea: 'Idea',
        itemLogline: 'Logline',
        itemSynopsis: 'Synopsis',
        itemScenario: 'Scenario',
        itemCharDesign: 'Character Design',
        itemPropDesign: 'Prop Design',
        itemSetDesign: 'Background Set Design',
        itemSbPanels: 'Storyboard Panels',
        itemSbReview: 'Storyboard Continuity',
        itemRoughAnimatic: 'Rough Animatic',
        itemTimedAnimatic: 'Timed Animatic & Audio',
        itemCharModel: 'Character Modeling',
        itemEnvModel: 'Environment & Prop Modeling',
        itemCharRig: 'Character Rigging',
        itemPropRig: 'Prop & Set Rigging',
        itemCameras: 'Camera Layout',
        itemBlocking: 'Shot Blocking',
        itemKeyAnimation: 'Key Animation',
        itemSplinePolish: 'Animation Polish',
        itemShaders: 'Shading & Lookdev',
        itemSceneLighting: 'Lighting Setup',
        itemRenderPasses: 'Render Passes',
        itemRenderCheck: 'Render Quality Check',
        itemCompLayers: 'Compositing Layers',
        itemColorGrade: 'Color Grading',
        itemRoughCut: 'Assembly & Rough Cut',
        itemFinalCutCredits: 'Final Cut & Credits',
        itemSfxVoice: 'Dialogue, SFX & Foley',
        itemMusicMix: 'Music & Final Mix',
        itemMasterExport: 'Master Video Export',
        itemArchivePack: 'Project Archive'
      }
    };

    /* =========================================================================
       3. APPLICATION STATE & STORAGE HELPERS
       ========================================================================= */
    const I18N_EXTRA = {
      sr: {
        registerLink: 'Registracija', loginLink: 'Prijava',
        noAccount: 'Nemate nalog?', haveAccount: 'Već imate nalog?',
        settingsBtn: 'Podešavanja', emailLbl: 'Email', skipBtn: 'Preskoči za sada',
        profHint: 'Profesori se prijavljuju nalogom koji im je otvoren u Podešavanjima.',
        noProfileErr: 'Nalog nema profil u bazi.', notProfessorErr: 'Ovaj nalog nije profesorski.',
        weakPassErr: 'Lozinka mora imati najmanje 6 karaktera.', invalidEmailErr: 'Neispravan email.',
        networkErr: 'Nema veze sa serverom.', tooManyErr: 'Previše pokušaja, sačekajte malo.',
        permErr: 'Nedostaje dozvola (proverite Firestore rules).', profExistsErr: 'Profesor sa ovim emailom već postoji.',
        saveErr: 'Čuvanje nije uspelo.', driveErr: 'Google Drive greška:',
        driveNotConfigured: 'Google Drive nije podešen (GOOGLE_CLIENT_ID) ili skripta još nije učitana.',
        noAssetsFolder: 'Projekat nema „Assets & Media” folder na Drive-u.',
        uploading: (n) => `Otpremanje na Drive (${n})…`, sheetSynced: 'Google Sheet je ažuriran.',
        openOnDrive: 'Otvori na Drive-u',
        inboxTitle: 'Za pregled', noNotifs: 'Nema ničega na čekanju.',
        inboxApprovals: (n) => `${n} čeka odobrenje`, inboxQuestions: (n) => `${n} ${n === 1 ? 'pitanje' : 'pitanja'}`,
        adminBadErr: 'Pogrešno korisničko ime ili lozinka.',
        settingsSub: 'Registracija profesora i podrazumevani šablon (faze, kategorije, zadaci) za nove projekte.',
        settingsBack: '← Nazad na prijavu',
        profSectionTitle: 'Profesori', profSectionSub: 'Registrovani profesori se prijavljuju emailom i lozinkom na kartici „Profesor”.',
        prName: 'Ime i prezime', prTitle: 'Oblast / titula', prEmail: 'Email (za prijavu)', prPass: 'Lozinka * (min. 6)',
        prRegisterBtn: '+ Registruj profesora', noProfessorsYet: 'Još nema registrovanih profesora.',
        profRegistered: (n) => `Profesor registrovan: ${n}`, profDeleteConfirm: (n) => `Ukloniti profesora ${n}?`,
        tplTitle: 'Podrazumevani šablon projekta',
        tplSub: 'Svaki novi projekat se pravi po ovom šablonu. Postojeći projekti se ne menjaju.',
        tplReset: 'Vrati početni', tplSave: 'Sačuvaj šablon', tplSaved: 'Šablon je sačuvan.',
        tplAddTask: '+ zadatak', tplAddCat: '+ kategorija', tplNewTask: 'Novi zadatak', tplNewCat: 'Nova kategorija'
      },
      en: {
        registerLink: 'Register', loginLink: 'Sign in',
        noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
        settingsBtn: 'Settings', emailLbl: 'Email', skipBtn: 'Skip for now',
        profHint: 'Professors sign in with the account created for them in Settings.',
        noProfileErr: 'This account has no profile in the database.', notProfessorErr: 'This account is not a professor account.',
        weakPassErr: 'Password must be at least 6 characters.', invalidEmailErr: 'Invalid email.',
        networkErr: 'Cannot reach the server.', tooManyErr: 'Too many attempts, wait a moment.',
        permErr: 'Permission denied (check Firestore rules).', profExistsErr: 'A professor with this email already exists.',
        saveErr: 'Saving failed.', driveErr: 'Google Drive error:',
        driveNotConfigured: 'Google Drive is not configured (GOOGLE_CLIENT_ID) or the script has not loaded yet.',
        noAssetsFolder: 'This project has no "Assets & Media" folder on Drive.',
        uploading: (n) => `Uploading to Drive (${n})…`, sheetSynced: 'Google Sheet updated.',
        openOnDrive: 'Open on Drive',
        inboxTitle: 'To review', noNotifs: 'Nothing pending.',
        inboxApprovals: (n) => `${n} awaiting approval`, inboxQuestions: (n) => `${n} ${n === 1 ? 'question' : 'questions'}`,
        adminBadErr: 'Wrong username or password.',
        settingsSub: 'Register professors and set the default template (phases, categories, tasks) for new projects.',
        settingsBack: '← Back to sign in',
        profSectionTitle: 'Professors', profSectionSub: 'Registered professors sign in with email and password on the "Professor" tab.',
        prName: 'Full name', prTitle: 'Field / title', prEmail: 'Email (for sign-in)', prPass: 'Password * (min. 6)',
        prRegisterBtn: '+ Register professor', noProfessorsYet: 'No professors registered yet.',
        profRegistered: (n) => `Professor registered: ${n}`, profDeleteConfirm: (n) => `Remove professor ${n}?`,
        tplTitle: 'Default project template',
        tplSub: 'Every new project is created from this template. Existing projects are not changed.',
        tplReset: 'Reset to built-in', tplSave: 'Save template', tplSaved: 'Template saved.',
        tplAddTask: '+ task', tplAddCat: '+ category', tplNewTask: 'New task', tplNewCat: 'New category'
      }
    };
    Object.assign(I18N.sr, I18N_EXTRA.sr);
    Object.assign(I18N.en, I18N_EXTRA.en);

    let currentLang = 'sr';
    let studentsData = [];
    let pendingStudentReg = null;
    let activeAddContext = null; // { type: 'category' | 'task', phase?: string, catId?: string }
    let activeTaskModalIds = null; // { catId, taskId }

    const appState = {
      userType: null,        // 'student' | 'professor' | null
      currentUser: null,     // student object or professor object
      activeTab: 'projects', // 'projects' | 'workspace'
      activeProjectId: null,
      inspectStudentId: null,
      profYearFilter: 'ALL',  // 'ALL' | '1' | '2' | '3' | '4'
      booting: false,
      adminOpen: false,
      driveOnboarding: false,
      justRegistered: false
    };

    function t(key, ...args) {
      const dict = I18N[currentLang] || I18N.sr;
      const val = dict[key] !== undefined ? dict[key] : I18N.sr[key];
      if (typeof val === 'function') return val(...args);
      return val !== undefined ? val : key;
    }

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    const ICONS = {
      bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
      folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
      clip: '<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.6 8.6a2 2 0 0 1-3-3L15 7"/>',
      chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
      question: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
      hourglass: '<path d="M6 2h12M6 22h12M7 2v4a5 5 0 0 0 2 4l3 2-3 2a5 5 0 0 0-2 4v4M17 2v4a5 5 0 0 1-2 4l-3 2 3 2a5 5 0 0 1 2 4v4"/>',
      gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
      chevron: '<path d="m6 9 6 6 6-6"/>'
    };
    function ic(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }
    function injectStaticIcons(root) {
      (root || document).querySelectorAll('i[data-ic]').forEach(el => { el.outerHTML = ic(el.getAttribute('data-ic')); });
    }

    function showToast(msg) {
      const box = document.getElementById('toast-box');
      if (!box) return;
      box.textContent = msg;
      box.classList.remove('hidden');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => {
        box.classList.add('hidden');
      }, 2600);
    }

    function closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
      if (id === 'task-detail-modal') activeTaskModalIds = null;
      if (id === 'add-item-modal') activeAddContext = null;
    }

    /* =========================================================================
       3b. BACKEND LAYER — Firebase Auth + Firestore (data) and Google Drive/Sheets
       ========================================================================= */
    let fbApp = null, auth = null, db = null, secondaryApp = null;
    let unsubs = [];
    let studentProfiles = {};   // uid -> profile (students)
    let projectsById = {};      // projectId -> project doc
    let projectTemplate = null; // settings/template
    let writesInFlight = 0, rebuildPending = false, writeChain = Promise.resolve();
    let registering = false;
    let adminTplDraft = null;

    function indexToEmail(idx) {
      const slug = String(idx).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return `${slug || 'student'}@students.animpipe.app`;
    }

    function authErrMsg(err, ctx) {
      const code = (err && err.code) || '';
      if (code === 'auth/email-already-in-use') return ctx === 'prof' ? t('profExistsErr') : t('dupIndexErr');
      if (code === 'auth/weak-password') return t('weakPassErr');
      if (code === 'auth/invalid-email') return t('invalidEmailErr');
      if (code === 'auth/network-request-failed') return t('networkErr');
      if (code === 'auth/too-many-requests') return t('tooManyErr');
      if (code === 'permission-denied' || code === 'auth/operation-not-allowed') return t('permErr') + ' (' + code + ')';
      if (code.indexOf('auth/') === 0) return t('loginErr');
      return (err && err.message) ? err.message : String(err);
    }

    function initBackend() {
      fbApp = firebase.initializeApp(FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();

      // Public listeners (professor list + project template)
      db.collection('users').where('role', '==', 'professor').onSnapshot(snap => {
        PROFESSORS = snap.docs.map(d => {
          const x = d.data();
          return { id: d.id, name: x.name || x.email, email: x.email || '', roleTitleSr: x.title || '', roleTitleEn: x.title || '' };
        }).sort((a, b) => a.name.localeCompare(b.name));
        if (appState.adminOpen) renderSettingsProfessors();
        if (appState.userType) { renderAll(); }
      }, err => console.warn('professors listener', err));

      db.collection('settings').doc('template').onSnapshot(snap => {
        projectTemplate = snap.exists ? (snap.data().phases || null) : null;
      }, err => console.warn('template listener', err));

      auth.onAuthStateChanged(handleAuthState);
    }

    function stopUserListeners() {
      unsubs.forEach(fn => { try { fn(); } catch (e) {} });
      unsubs = [];
    }

    async function handleAuthState(user) {
      if (registering) return;
      stopUserListeners();
      if (!user) {
        appState.userType = null;
        appState.currentUser = null;
        appState.inspectStudentId = null;
        appState.activeProjectId = null;
        appState.driveOnboarding = false;
        appState.booting = false;
        studentProfiles = {};
        projectsById = {};
        studentsData = [];
        driveToken = null;
        renderAll();
        return;
      }
      try {
        const snap = await db.collection('users').doc(user.uid).get();
        if (!snap.exists) {
          await auth.signOut();
          appState.booting = false;
          renderAll();
          showAuthError(t('noProfileErr'));
          return;
        }
        bootUser(user.uid, snap.data());
      } catch (err) {
        console.error(err);
        appState.booting = false;
        renderAll();
        showAuthError(authErrMsg(err));
      }
    }

    function bootUser(uid, profile) {
      appState.booting = false;
      appState.inspectStudentId = null;
      appState.activeProjectId = null;
      appState.activeTab = 'projects';
      studentProfiles = {};
      projectsById = {};

      if (profile.role === 'professor') {
        appState.userType = 'professor';
        appState.currentUser = { id: uid, name: profile.name, email: profile.email, roleTitleSr: profile.title || '', roleTitleEn: profile.title || '' };
        unsubs.push(db.collection('users').where('role', '==', 'student').onSnapshot(snap => {
          studentProfiles = {};
          snap.docs.forEach(d => { studentProfiles[d.id] = { id: d.id, ...d.data() }; });
          onDataChanged();
        }, err => console.error('students listener', err)));
        unsubs.push(db.collection('projects').onSnapshot(snap => {
          projectsById = {};
          snap.docs.forEach(d => { projectsById[d.id] = { ...d.data(), id: d.id }; });
          onDataChanged();
        }, err => console.error('projects listener', err)));
      } else {
        appState.userType = 'student';
        appState.currentUser = { id: uid, ...profile, projects: [] };
        appState.driveOnboarding = Boolean(appState.justRegistered) && !profile.driveRootFolderId;
        appState.justRegistered = false;
        unsubs.push(db.collection('users').doc(uid).onSnapshot(snap => {
          studentProfiles = {};
          if (snap.exists) studentProfiles[uid] = { id: uid, ...snap.data() };
          onDataChanged();
        }, err => console.error('profile listener', err)));
        unsubs.push(db.collection('projects').where('studentId', '==', uid).onSnapshot(snap => {
          projectsById = {};
          snap.docs.forEach(d => { projectsById[d.id] = { ...d.data(), id: d.id }; });
          onDataChanged();
        }, err => console.error('projects listener', err)));
      }
      rebuildStudentsData();
      renderAll();
    }

    function rebuildStudentsData() {
      const byStudent = {};
      Object.values(projectsById).forEach(p => {
        (byStudent[p.studentId] = byStudent[p.studentId] || []).push(p);
      });
      studentsData = Object.values(studentProfiles).map(u => ({
        ...u,
        projects: (byStudent[u.id] || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      }));
      if (appState.userType === 'student' && appState.currentUser) {
        const me = studentsData.find(x => x.id === appState.currentUser.id);
        if (me) appState.currentUser = me;
      }
    }

    function onDataChanged() {
      if (writesInFlight > 0) { rebuildPending = true; return; }
      refreshFromBackend();
    }

    function refreshFromBackend() {
      rebuildStudentsData();
      if (!appState.userType) return;
      renderAll();
      if (activeTaskModalIds && !lightboxState) {
        const inp = document.getElementById('td-comment-input');
        if (!inp || inp.value === '') openTaskModal(activeTaskModalIds.catId, activeTaskModalIds.taskId);
      }
    }

    // Legacy name kept: every existing edit calls this. It now persists the active project to Firestore.
    function saveStudentsToStorage() {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (stu && proj) {
        persistProject(proj, stu.id);
        scheduleSheetSync(proj);
      }
    }

    function mergeRemoteProject(local, remote) {
      const rt = {};
      (remote.categories || []).forEach(c => (c.tasks || []).forEach(tk => { rt[c.id + '/' + tk.id] = tk; }));
      (local.categories || []).forEach(c => (c.tasks || []).forEach(tk => {
        const r = rt[c.id + '/' + tk.id];
        if (!r) return;
        if (!Array.isArray(tk.comments)) tk.comments = [];
        const have = {};
        tk.comments.forEach(cm => { if (cm.id) have[cm.id] = cm; });
        (r.comments || []).forEach(rc => {
          if (!rc.id) return;
          const l = have[rc.id];
          if (!l) tk.comments.push(rc);
          else { l.read = Boolean(l.read || rc.read); l.answered = Boolean(l.answered || rc.answered); }
        });
        tk.comments.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      }));
    }

    function persistProject(proj, studentId) {
      const data = JSON.parse(JSON.stringify(proj));
      data.studentId = studentId || proj.studentId;
      if (!data.createdAt) data.createdAt = Date.now();
      data.updatedAt = Date.now();
      delete data.projects;
      writesInFlight++;
      writeChain = writeChain
        .then(() => db.runTransaction(async tx => {
          const ref = db.collection('projects').doc(data.id);
          const snap = await tx.get(ref);
          if (snap.exists) mergeRemoteProject(data, snap.data());
          tx.set(ref, data);
        }))
        .catch(err => { console.error(err); showToast(t('saveErr') + ' ' + authErrMsg(err)); })
        .finally(() => {
          writesInFlight--;
          if (writesInFlight === 0 && rebuildPending) { rebuildPending = false; refreshFromBackend(); }
        });
      return writeChain;
    }

    /* ---------- Google Drive / Sheets (Google Identity Services token client) ---------- */
    let driveToken = null, driveTokenExp = 0, tokenClient = null;
    const JSON_HDR = { 'Content-Type': 'application/json' };
    const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';

    function driveConfigured() {
      return !/^YOUR_/.test(GOOGLE_CLIENT_ID) && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2;
    }

    function driveTokenValid() { return Boolean(driveToken) && Date.now() < driveTokenExp - 60000; }

    // IMPORTANT: call this synchronously from a click/submit handler (popup needs a user gesture).
    function getDriveToken() {
      return new Promise((resolve, reject) => {
        if (driveTokenValid()) return resolve(driveToken);
        if (!driveConfigured()) return reject(new Error(t('driveNotConfigured')));
        if (!tokenClient) {
          tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: GOOGLE_SCOPES, callback: () => {} });
        }
        tokenClient.callback = resp => {
          if (resp.error) return reject(new Error(resp.error));
          driveToken = resp.access_token;
          driveTokenExp = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
          resolve(driveToken);
        };
        tokenClient.error_callback = err => reject(new Error((err && err.type) || 'popup_failed'));
        try { tokenClient.requestAccessToken({ prompt: '' }); } catch (e) { reject(e); }
      });
    }


    // Auto-reconnect Drive: the first click after load/expiry doubles as the user gesture the Google popup needs.
    let driveReconnecting = false, driveReconnectFail = 0;
    document.addEventListener('click', () => {
      if (appState.userType !== 'student' || typeof google === 'undefined' || !driveConfigured()) return;
      if (driveTokenValid() || driveReconnecting || Date.now() - driveReconnectFail < 30000) return;
      driveReconnecting = true;
      getDriveToken().then(() => { showToast('Google Drive povezan'); })
        .catch(() => { driveReconnectFail = Date.now(); })
        .finally(() => { driveReconnecting = false; });
    }, true);

    async function driveFetch(url, opts) {
      const o = opts || {};
      const token = await getDriveToken();
      const res = await fetch(url, { ...o, headers: { ...(o.headers || {}), Authorization: 'Bearer ' + token } });
      if (!res.ok) {
        const txt = await res.text();
        const err = new Error('Google API ' + res.status + ': ' + txt.slice(0, 220));
        err.status = res.status;
        throw err;
      }
      return res.status === 204 ? null : res.json();
    }

    function driveCreateFolder(name, parentId) {
      const body = { name, mimeType: 'application/vnd.google-apps.folder' };
      if (parentId) body.parents = [parentId];
      return driveFetch(DRIVE_FILES + '?fields=id,name,webViewLink', { method: 'POST', headers: JSON_HDR, body: JSON.stringify(body) });
    }

    function driveShareAnyone(fileId) {
      return driveFetch(`${DRIVE_FILES}/${fileId}/permissions`, { method: 'POST', headers: JSON_HDR, body: JSON.stringify({ type: 'anyone', role: 'reader' }) });
    }

    function driveCreateSheet(name, parentId) {
      return driveFetch(DRIVE_FILES + '?fields=id,name,webViewLink', {
        method: 'POST', headers: JSON_HDR,
        body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.spreadsheet', parents: [parentId] })
      });
    }

    function driveUpload(file, parentId) {
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: file.name, parents: [parentId] })], { type: 'application/json' }));
      form.append('file', file);
      return driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink', { method: 'POST', body: form });
    }

    async function fetchGoogleEmail() {
      try {
        const info = await driveFetch('https://www.googleapis.com/oauth2/v3/userinfo');
        return (info && info.email) || '';
      } catch (e) { return ''; }
    }

    async function ensureRootFolder(stu) {
      if (stu.driveRootFolderId) {
        try {
          const f = await driveFetch(`${DRIVE_FILES}/${stu.driveRootFolderId}?fields=id,trashed`);
          if (f && !f.trashed) return stu.driveRootFolderId;
        } catch (e) { /* deleted or inaccessible -> recreate */ }
      }
      const root = await driveCreateFolder('Animation Pipeline');
      stu.driveRootFolderId = root.id;
      await db.collection('users').doc(stu.id).update({ driveRootFolderId: root.id });
      return root.id;
    }

    function mediaThumbUrl(item, size) {
      if (item.url) return item.url;
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.driveFileId)}&sz=w${size || 600}`;
    }

    function mediaDriveUrl(item) {
      return item.webViewLink || (item.driveFileId ? `https://drive.google.com/file/d/${item.driveFileId}/view` : '');
    }

    /* ---------- Google Sheet schedule sync ---------- */
    let sheetSyncTimer = null;

    function buildSheetValues(proj) {
      const weeks = proj.totalWeeks || 4;
      const days = t('daysShort');
      const phaseLbl = { PRE: 'PRETPRODUKCIJA', PROD: 'PRODUKCIJA', POST: 'POSTPRODUKCIJA' };
      const header = ['Faza', 'Kategorija', 'Zadatak', 'Status'];
      for (let w = 1; w <= weeks; w++) for (let d = 0; d < 7; d++) header.push(`N${w} ${days[d]}`);
      const rows = [[proj.name, `${proj.animationType} · ${proj.length}`, `${proj.startDate} → ${proj.endDate}`], [], header];
      ['PRE', 'PROD', 'POST'].forEach(ph => {
        (proj.categories || []).filter(c => c.phase === ph).forEach(cat => {
          (cat.tasks || []).forEach(tk => {
            const set = new Set(tk.scheduledDays || []);
            const row = [phaseLbl[ph], getCategoryDisplayName(cat), getTaskDisplayName(tk), getStatusLabel(tk.status)];
            for (let i = 0; i < weeks * 7; i++) row.push(set.has(colIndexToDayKey(i)) ? 'x' : '');
            rows.push(row);
          });
        });
      });
      return rows;
    }

    async function syncSheetNow(proj) {
      if (!proj || !proj.driveSheetId) return;
      const base = `https://sheets.googleapis.com/v4/spreadsheets/${proj.driveSheetId}/values`;
      await driveFetch(`${base}/A1:ZZ1000:clear`, { method: 'POST', headers: JSON_HDR, body: '{}' });
      await driveFetch(`${base}/A1?valueInputOption=RAW`, {
        method: 'PUT', headers: JSON_HDR,
        body: JSON.stringify({ range: 'A1', majorDimension: 'ROWS', values: buildSheetValues(proj) })
      });
    }

    function scheduleSheetSync(proj) {
      if (appState.userType !== 'student' || !proj || !proj.driveSheetId || !driveTokenValid()) return;
      clearTimeout(sheetSyncTimer);
      sheetSyncTimer = setTimeout(() => {
        const stu = getActiveStudent();
        const p = getActiveProject(stu);
        if (p && p.id === proj.id) syncSheetNow(p).catch(err => console.warn('sheet sync', err));
      }, 3000);
    }

    function syncSheetClick() {
      const tokenP = getDriveToken();
      const proj = getActiveProject(getActiveStudent());
      if (!proj) return;
      tokenP.then(() => syncSheetNow(proj)).then(() => showToast(t('sheetSynced')))
        .catch(err => showToast(t('driveErr') + ' ' + err.message));
    }

    /* ---------- Project template (settings/template) ---------- */
    function defaultTemplate() {
      const sr = I18N.sr;
      const tpl = { PRE: [], PROD: [], POST: [] };
      buildBuiltinCategories().forEach(c => {
        tpl[c.phase].push({
          name: sr[c.presetKey] || c.customName,
          color: c.color,
          tasks: c.tasks.map(tk => sr[tk.presetKey] || tk.customName)
        });
      });
      return tpl;
    }

    function getTemplate() {
      const tp = projectTemplate;
      if (tp && tp.PRE && tp.PROD && tp.POST) return tp;
      return defaultTemplate();
    }

    /* =========================================================================
       4. DEFAULT CATEGORIES & TASKS FOR NEW PROJECTS
       ========================================================================= */
    function buildBuiltinCategories() {
      return [
        {
          id: 'cat-writing',
          phase: 'PRE',
          presetKey: 'catWriting',
          customName: '',
          color: '#22c55e',
          tasks: [
            { id: 'tk-idea', presetKey: 'itemIdea', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] },
            { id: 'tk-logline', presetKey: 'itemLogline', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] },
            { id: 'tk-synopsis', presetKey: 'itemSynopsis', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] },
            { id: 'tk-scenario', presetKey: 'itemScenario', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-concept',
          phase: 'PRE',
          presetKey: 'catConcept',
          customName: '',
          color: '#38bdf8',
          tasks: [
            { id: 'tk-char-design', presetKey: 'itemCharDesign', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] },
            { id: 'tk-prop-design', presetKey: 'itemPropDesign', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-storyboard',
          phase: 'PRE',
          presetKey: 'catStoryboard',
          customName: '',
          color: '#a855f7',
          tasks: [
            { id: 'tk-sb-panels', presetKey: 'itemSbPanels', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-modeling',
          phase: 'PROD',
          presetKey: 'catModeling',
          customName: '',
          color: '#6366f1',
          tasks: [
            { id: 'tk-char-model', presetKey: 'itemCharModel', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] },
            { id: 'tk-env-model', presetKey: 'itemEnvModel', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-rigging',
          phase: 'PROD',
          presetKey: 'catRigging',
          customName: '',
          color: '#06b6d4',
          tasks: [
            { id: 'tk-char-rig', presetKey: 'itemCharRig', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-animation',
          phase: 'PROD',
          presetKey: 'catAnimation',
          customName: '',
          color: '#10b981',
          tasks: [
            { id: 'tk-key-anim', presetKey: 'itemKeyAnimation', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-compositing',
          phase: 'POST',
          presetKey: 'catCompositing',
          customName: '',
          color: '#a855f7',
          tasks: [
            { id: 'tk-comp-layers', presetKey: 'itemCompLayers', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        },
        {
          id: 'cat-sound',
          phase: 'POST',
          presetKey: 'catSound',
          customName: '',
          color: '#14b8a6',
          tasks: [
            { id: 'tk-sfx-voice', presetKey: 'itemSfxVoice', customName: '', status: 'Not Started', reviewerProfId: '', scheduledDays: [], media: [], comments: [] }
          ]
        }
      ];
    }

    function buildStarterCategories() {
      const tpl = getTemplate();
      const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const out = [];
      ['PRE', 'PROD', 'POST'].forEach(ph => {
        (tpl[ph] || []).forEach(c => {
          out.push({
            id: 'cat-' + rid(),
            phase: ph,
            presetKey: '',
            customName: c.name,
            color: c.color || '#6366f1',
            tasks: (c.tasks || []).map(name => ({
              id: 'tk-' + rid(), presetKey: '', customName: name, status: 'Not Started',
              reviewerProfId: '', scheduledDays: [], media: [], comments: []
            }))
          });
        });
      });
      return out;
    }

    function calcWeeksFromDates(startStr, endStr) {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 4;
      const diffDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(4, Math.min(36, Math.ceil(diffDays / 7)));
    }

    function createNewProjectObj({ name, animationType, length, startDate, endDate, isPublic }) {
      const cleanName = String(name || '').trim() || 'Projekat';
      const folderPath = `Animation Pipeline / ${cleanName}`;
      return {
        id: 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        driveFolderPath: folderPath,
        animationType: animationType || '3D CGI',
        length: length || '03:00 min',
        startDate: startDate || '2026-11-23',
        endDate: endDate || '2026-12-20',
        totalWeeks: calcWeeksFromDates(startDate, endDate),
        isPublic: Boolean(isPublic),
        grades: { pre: '', prod: '', post: '', final: '' },
        profNote: '',
        categories: buildStarterCategories()
      };
    }

    function normalizeProject(proj) {
      if (!proj) return null;
      if (!proj.driveFolderPath) {
        proj.driveFolderPath = `Animation Pipeline / ${proj.name || 'Projekat'}`;
      }
      if (!proj.grades) {
        proj.grades = { pre: '', prod: '', post: '', final: '' };
      }
      if (!Array.isArray(proj.categories) || proj.categories.length === 0) {
        proj.categories = buildStarterCategories();
      }
      proj.categories.forEach(cat => {
        if (!Array.isArray(cat.tasks)) cat.tasks = [];
        cat.tasks.forEach(tk => {
          if (!Array.isArray(tk.scheduledDays)) tk.scheduledDays = [];
          if (!Array.isArray(tk.media)) tk.media = [];
          if (!Array.isArray(tk.comments)) tk.comments = [];
          if (tk.reviewerProfId === undefined) tk.reviewerProfId = '';
        });
      });
      return proj;
    }

    /* =========================================================================
       5. LANGUAGE SWITCHING & STATIC UI LABELS
       ========================================================================= */
    function setLanguage(lang) {
      if (lang !== 'sr' && lang !== 'en') return;
      currentLang = lang;
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch (err) {
        // Ignore storage error
      }
      document.documentElement.lang = lang;
      renderAll();
    }

    function applyStaticTranslations() {
      document.title = t('appTitle');

      document.querySelectorAll('[id^="lang-"], [id^="auth-lang-"]').forEach(btn => {
        const isSr = btn.id.endsWith('-sr');
        const isEn = btn.id.endsWith('-en');
        if (isSr) btn.classList.toggle('active', currentLang === 'sr');
        if (isEn) btn.classList.toggle('active', currentLang === 'en');
      });

      updateAccountLabels();
      document.getElementById('topbar-title').textContent = t('appTitle');
      document.getElementById('auth-main-title').textContent = t('appTitle');
      document.getElementById('auth-main-sub').textContent = t('authSub');

      document.getElementById('role-tab-student').textContent = t('studentTab');
      document.getElementById('role-tab-professor').textContent = t('professorTab');
      document.getElementById('stu-mode-register').textContent = t('registerLink');
      document.getElementById('stu-mode-login').textContent = t('loginLink');
      document.getElementById('stu-mode-hint').textContent = t(document.getElementById('student-login-form').classList.contains('hidden') ? 'haveAccount' : 'noAccount');

      document.getElementById('lbl-reg-fname').textContent = t('firstName');
      document.getElementById('lbl-reg-lname').textContent = t('lastName');
      document.getElementById('lbl-reg-index').textContent = t('indexId');
      document.getElementById('lbl-reg-year').textContent = t('studyYear');
      document.getElementById('lbl-reg-pass').textContent = t('password') + ' (min. 6)';
      document.getElementById('btn-reg-submit').textContent = t('registerBtn');

      document.getElementById('lbl-login-index').textContent = t('indexId');
      document.getElementById('lbl-login-pass').textContent = t('password');
      document.getElementById('btn-login-submit').textContent = t('loginBtn');

      const yearSelect = document.getElementById('reg-year');
      Array.from(yearSelect.options).forEach(opt => {
        opt.textContent = t('yearShort', opt.value);
      });

      document.getElementById('prof-auth-hint').textContent = t('profHint');
      document.getElementById('open-settings-label').textContent = t('settingsBtn');
      document.getElementById('lbl-prof-email').textContent = t('emailLbl') + ' *';
      document.getElementById('lbl-prof-pass').textContent = t('password');
      document.getElementById('btn-prof-login').textContent = t('loginBtn');
      document.getElementById('logout-btn').textContent = t('logout');

      // Drive onboarding
      document.getElementById('gdrive-title').textContent = t('gdriveTitle');
      document.getElementById('lbl-gdrive-email').textContent = t('gdriveEmailLbl');
      document.getElementById('btn-gdrive-cancel').textContent = t('skipBtn');
      document.getElementById('btn-gdrive-connect').textContent = t('gdriveConnectBtn');

      // Projects view
      document.getElementById('nav-projects').textContent = appState.userType === 'professor' ? t('navProfYears') : t('navProjects');
      document.getElementById('nav-workspace').textContent = t('navWorkspace');
      document.getElementById('projects-sub').textContent = t('projectsSub');
      document.querySelector('#projects-screen .section-header .btn-primary').textContent = t('newProjectBtn');

      // New project modal
      document.getElementById('np-modal-title').textContent = t('npTitle');
      document.getElementById('lbl-np-name').textContent = t('npName');
      document.getElementById('lbl-np-type').textContent = t('npType');
      document.getElementById('lbl-np-length').textContent = t('npLength');
      document.getElementById('lbl-np-start').textContent = t('npStart');
      document.getElementById('lbl-np-end').textContent = t('npEnd');
      document.getElementById('lbl-np-vis').textContent = t('npVis');
      document.getElementById('btn-np-cancel').textContent = t('cancel');
      document.getElementById('btn-np-submit').textContent = t('createBtn');

      const visSel = document.getElementById('np-visibility');
      visSel.options[0].textContent = `${t('publicLbl')} (Public)`;
      visSel.options[1].textContent = `${t('privateLbl')} (Private)`;

      // Workspace labels
      document.getElementById('ws-back-prof-btn').textContent = t('backToYearBtn');
      document.getElementById('ws-back-projects-btn').textContent = t('myProjectsBtn');
      document.getElementById('ws-add-week-btn').textContent = t('addWeekBtn');
      document.getElementById('ws-grade-btn').textContent = t('gradeActionBtn');
      document.getElementById('ws-progress-label').textContent = t('approvedProgressLbl');
      document.getElementById('ws-progress-hint').textContent = t('progressRule');
      document.getElementById('ws-prof-note-title').textContent = t('profNoteTitle');

      // Professor dashboard labels
      document.getElementById('prof-dash-title').textContent = t('profDashTitle');
      document.getElementById('prof-dash-sub').textContent = t('profDashSub');

      // Grading modal labels
      document.getElementById('gm-title').textContent = t('gmTitle');
      document.getElementById('lbl-gm-pre').textContent = t('gmPre');
      document.getElementById('lbl-gm-prod').textContent = t('gmProd');
      document.getElementById('lbl-gm-post').textContent = t('gmPost');
      document.getElementById('lbl-gm-final').textContent = t('gmFinal');
      document.getElementById('lbl-gm-note').textContent = t('gmNote');
      document.getElementById('btn-gm-cancel').textContent = t('cancel');
      document.getElementById('btn-gm-save').textContent = t('saveGradesBtn');

      // Add item modal labels
      document.getElementById('lbl-ai-preset').textContent = t('presetLbl');
      document.getElementById('lbl-ai-color').textContent = t('colorLbl');
      document.getElementById('lbl-ai-name').textContent = t('nameLbl');
      document.getElementById('btn-ai-cancel').textContent = t('cancel');
      document.getElementById('btn-ai-submit').textContent = t('addBtn');
    }

    /* =========================================================================
       6. AUTHENTICATION & GOOGLE DRIVE ONBOARDING
       ========================================================================= */
    function switchRoleTab(role) {
      const isStu = role === 'student';
      document.getElementById('role-tab-student').classList.toggle('active', isStu);
      document.getElementById('role-tab-professor').classList.toggle('active', !isStu);
      document.getElementById('student-auth-panel').classList.toggle('hidden', !isStu);
      document.getElementById('professor-auth-panel').classList.toggle('hidden', isStu);
      hideAuthError();
    }

    function switchStudentAuthMode(mode) {
      const isReg = mode === 'register';
      document.getElementById('student-register-form').classList.toggle('hidden', !isReg);
      document.getElementById('student-login-form').classList.toggle('hidden', isReg);
      document.getElementById('stu-mode-register').classList.toggle('hidden', isReg);
      document.getElementById('stu-mode-login').classList.toggle('hidden', !isReg);
      document.getElementById('stu-mode-hint').textContent = t(isReg ? 'haveAccount' : 'noAccount');
      hideAuthError();
    }

    function showAuthError(msg) {
      const box = document.getElementById('auth-error-box');
      box.textContent = msg;
      box.classList.remove('hidden');
    }

    function hideAuthError() {
      const box = document.getElementById('auth-error-box');
      box.textContent = '';
      box.classList.add('hidden');
    }

    async function handleStudentRegister(e) {
      e.preventDefault();
      hideAuthError();
      const firstName = document.getElementById('reg-fname').value.trim();
      const lastName = document.getElementById('reg-lname').value.trim();
      const indexId = document.getElementById('reg-index').value.trim();
      const studyYear = Number(document.getElementById('reg-year').value) || 1;
      const password = document.getElementById('reg-pass').value;
      if (!firstName || !lastName || !indexId || !password) return;

      const btn = document.getElementById('btn-reg-submit');
      btn.disabled = true;
      registering = true;
      try {
        const cred = await auth.createUserWithEmailAndPassword(indexToEmail(indexId), password);
        const profile = {
          role: 'student', firstName, lastName, name: `${firstName} ${lastName}`, indexId, studyYear,
          googleEmail: '', driveRootFolderId: '', createdAt: Date.now()
        };
        await db.collection('users').doc(cred.user.uid).set(profile);
        appState.justRegistered = true;
        registering = false;
        document.getElementById('student-register-form').reset();
        bootUser(cred.user.uid, profile);
      } catch (err) {
        registering = false;
        showAuthError(authErrMsg(err));
      } finally {
        btn.disabled = false;
      }
    }

    async function handleStudentLogin(e) {
      e.preventDefault();
      hideAuthError();
      const indexId = document.getElementById('login-index').value.trim();
      const password = document.getElementById('login-pass').value;
      const btn = document.getElementById('btn-login-submit');
      btn.disabled = true;
      try {
        await auth.signInWithEmailAndPassword(indexToEmail(indexId), password);
        document.getElementById('login-pass').value = '';
      } catch (err) {
        showAuthError(authErrMsg(err));
      } finally {
        btn.disabled = false;
      }
    }

    async function handleProfessorLogin(e) {
      e.preventDefault();
      hideAuthError();
      const email = document.getElementById('prof-login-email').value.trim();
      const password = document.getElementById('prof-login-pass').value;
      const btn = document.getElementById('btn-prof-login');
      btn.disabled = true;
      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const snap = await db.collection('users').doc(cred.user.uid).get();
        if (!snap.exists || snap.data().role !== 'professor') {
          await auth.signOut();
          showAuthError(t('notProfessorErr'));
        }
        document.getElementById('prof-login-pass').value = '';
      } catch (err) {
        showAuthError(authErrMsg(err));
      } finally {
        btn.disabled = false;
      }
    }

    /* ---- Drive onboarding (after student registration) ---- */
    function openDriveOnboardingScreen() { renderAll(); }

    function skipDriveOnboarding() {
      appState.driveOnboarding = false;
      renderAll();
    }
    function cancelDriveOnboarding() { skipDriveOnboarding(); }

    function confirmDriveConnection() {
      const stu = appState.currentUser;
      if (!stu) return;
      const log = document.getElementById('gdrive-progress-log');
      const btn = document.getElementById('btn-gdrive-connect');
      let tokenP;
      try { tokenP = getDriveToken(); } catch (err) { log.textContent = err.message; return; }  // sync: keeps the user gesture
      btn.disabled = true;
      log.textContent = t('gdriveWorking');
      tokenP.then(async () => {
        const email = await fetchGoogleEmail();
        await ensureRootFolder(stu);
        if (email) {
          stu.googleEmail = email;
          await db.collection('users').doc(stu.id).update({ googleEmail: email });
          document.getElementById('gdrive-email-input').value = email;
        }
        appState.driveOnboarding = false;
        renderAll();
        showToast(t('gdriveReady'));
      }).catch(err => {
        log.textContent = t('driveErr') + ' ' + err.message;
      }).finally(() => { btn.disabled = false; });
    }

    function logout() {
      if (auth) auth.signOut();
    }

    /* =========================================================================
       7. NAVIGATION, PROJECTS HOME & PROJECT CREATION
       ========================================================================= */
    function switchMainTab(tab) {
      if (appState.userType === 'professor') {
        if (tab === 'projects') {
          appState.inspectStudentId = null;
          appState.activeProjectId = null;
          appState.activeTab = 'projects';
        } else if (tab === 'workspace') {
          if (appState.inspectStudentId) {
            appState.activeTab = 'workspace';
          } else {
            appState.activeTab = 'projects';
          }
        }
        renderAll();
        return;
      }

      if (appState.userType === 'student') {
        if (tab === 'workspace') {
          const stu = appState.currentUser;
          const proj = (stu && stu.projects && stu.projects[0]) ? stu.projects[0] : null;
          if (!proj) {
            openNewProjectModal();
            return;
          }
          if (!appState.activeProjectId) appState.activeProjectId = proj.id;
        }
        appState.activeTab = tab;
        renderAll();
      }
    }

    function openNewProjectModal() {
      document.getElementById('new-project-form').reset();
      document.getElementById('np-type').value = '3D CGI';
      document.getElementById('np-length').value = '03:00 min';
      document.getElementById('np-start').value = '2026-11-23';
      document.getElementById('np-end').value = '2026-12-20';
      document.getElementById('np-visibility').value = 'public';
      document.getElementById('np-modal-sub').textContent = 'Animation Pipeline / [Naziv projekta]';
      document.getElementById('new-project-modal').classList.remove('hidden');
    }

    function handleCreateProject(e) {
      e.preventDefault();
      if (appState.userType !== 'student' || !appState.currentUser) return;
      const stu = appState.currentUser;

      const name = document.getElementById('np-name').value.trim();
      const animationType = document.getElementById('np-type').value;
      const length = document.getElementById('np-length').value.trim();
      const startDate = document.getElementById('np-start').value;
      const endDate = document.getElementById('np-end').value;
      const isPublic = document.getElementById('np-visibility').value === 'public';
      if (!name || !length || !startDate || !endDate) return;

      let tokenP;
      try { tokenP = getDriveToken(); } catch (err) { showToast(err.message); return; }  // sync: keeps the user gesture

      const btn = document.getElementById('btn-np-submit');
      const sub = document.getElementById('np-modal-sub');
      btn.disabled = true;
      const step = msg => { sub.textContent = msg; };

      (async () => {
        try {
          await tokenP;
          const proj = createNewProjectObj({ name, animationType, length, startDate, endDate, isPublic });
          step('Drive: Animation Pipeline…');
          const rootId = await ensureRootFolder(stu);
          step(`Drive: ${name}…`);
          const folder = await driveCreateFolder(name, rootId);
          await driveShareAnyone(folder.id);
          step('Drive: Assets & Media…');
          const assets = await driveCreateFolder('Assets & Media', folder.id);
          step('Google Sheet…');
          const sheet = await driveCreateSheet(`${name}_Schedule`, folder.id);

          proj.driveFolderId = folder.id;
          proj.driveFolderUrl = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;
          proj.assetsFolderId = assets.id;
          proj.driveSheetId = sheet.id;
          proj.driveSheetUrl = `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`;
          proj.createdAt = Date.now();
          try { await syncSheetNow(proj); } catch (err) { console.warn('initial sheet fill', err); }

          if (!Array.isArray(stu.projects)) stu.projects = [];
          stu.projects.push(proj);
          appState.activeProjectId = proj.id;
          persistProject(proj, stu.id);

          closeModal('new-project-modal');
          appState.activeTab = 'workspace';
          renderAll();
          showToast(t('projectCreated', proj.driveFolderPath));
        } catch (err) {
          console.error(err);
          sub.textContent = 'Animation Pipeline / [Naziv projekta]';
          showToast(t('driveErr') + ' ' + err.message);
        } finally {
          btn.disabled = false;
        }
      })();
    }

    function openProjectWorkspace(projectId) {
      appState.activeProjectId = projectId;
      appState.activeTab = 'workspace';
      renderAll();
    }

    function getActiveStudent() {
      if (appState.userType === 'student') return appState.currentUser;
      if (appState.userType === 'professor' && appState.inspectStudentId) {
        return studentsData.find(s => s.id === appState.inspectStudentId) || null;
      }
      return null;
    }

    function getActiveProject(stu) {
      if (!stu || !Array.isArray(stu.projects) || stu.projects.length === 0) return null;
      const found = stu.projects.find(p => p.id === appState.activeProjectId) || stu.projects[0];
      return normalizeProject(found);
    }

    function canEditActiveProject() {
      return appState.userType === 'student' && appState.currentUser && appState.inspectStudentId === null;
    }

    /* =========================================================================
       8. PROGRESS RULE (ONLY "Approved" / "Odobreno / Gotovo" COUNTS)
       ========================================================================= */
    function computeProgressStats(proj) {
      if (!proj) {
        return { total: 0, approved: 0, review: 0, approvedPct: 0, reviewPct: 0 };
      }
      normalizeProject(proj);
      let total = 0;
      let approved = 0;
      let review = 0;

      proj.categories.forEach(cat => {
        cat.tasks.forEach(tk => {
          total += 1;
          if (tk.status === 'Approved') {
            approved += 1;
          } else if (tk.status === 'Ready for Review') {
            review += 1;
          }
        });
      });

      if (total === 0) {
        return { total: 0, approved: 0, review: 0, approvedPct: 0, reviewPct: 0 };
      }

      const approvedPct = Math.round((approved / total) * 100);
      const reviewPct = Math.min(100 - approvedPct, Math.round((review / total) * 100));
      return { total, approved, review, approvedPct, reviewPct };
    }

    /* =========================================================================
       9. STUDENT PROJECTS HOME RENDER
       ========================================================================= */
    function renderProjectsScreen() {
      const stu = appState.currentUser;
      if (!stu) return;

      document.getElementById('projects-heading').textContent = t('projectsHeading', stu.name, stu.studyYear || 1);
      const grid = document.getElementById('projects-grid');
      const allProjects = Array.isArray(stu.projects) ? stu.projects : [];
      const archivedCount = allProjects.filter(p => p.archivedByStudent).length;
      const list = allProjects.filter(p => !p.archivedByStudent || appState.showArchived);

      if (list.length === 0) {
        grid.innerHTML = `
          <div class="card" style="grid-column:1/-1;text-align:center;padding:34px 18px">
            <p class="section-desc" style="margin:0 0 14px">${t('projectsSub')}</p>
            <button type="button" class="btn btn-primary" onclick="openNewProjectModal()">${t('newProjectBtn')}</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = list.map(rawProj => {
        const proj = normalizeProject(rawProj);
        const stats = computeProgressStats(proj);
        const finalGrade = (proj.grades && proj.grades.final) ? proj.grades.final : t('ungraded');
        return `
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;${proj.archivedByStudent ? 'opacity:.6' : ''}">
            <div>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600">${escapeHtml(proj.name)}${proj.archivedByStudent ? ` <span class="badge">${escapeHtml(t('archivedLbl'))}</span>` : ''}</h3>
                  <div class="brand-sub mono" style="margin-top:3px">${escapeHtml(proj.animationType)} · ${escapeHtml(proj.length)}</div>
                </div>
                <span class="badge ${proj.isPublic ? 'badge-public' : 'badge-private'}">
                  ${proj.isPublic ? t('publicLbl') : t('privateLbl')}
                </span>
              </div>

              <div class="brand-sub mono" style="margin-top:8px;color:#93c5fd">
                ${escapeHtml(proj.driveFolderPath)}
              </div>
              <div class="brand-sub mono" style="margin-top:4px">
                ${escapeHtml(proj.startDate)} → ${escapeHtml(proj.endDate)} (${proj.totalWeeks} ${t('weekLbl')})
              </div>

              <div style="margin-top:12px">
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:var(--text-secondary)">${t('approvedProgressLbl')} (${stats.approved}/${stats.total})</span>
                  <span class="mono" style="color:#86efac">${stats.approvedPct}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill-approved" style="width:${stats.approvedPct}%"></div>
                  <div class="progress-fill-review" style="width:${stats.reviewPct}%"></div>
                </div>
                ${stats.review > 0 ? `<div style="margin-top:6px"><span class="badge badge-review">${t('waitingBadge', stats.review)}</span></div>` : ''}
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border-subtle)">
              <span class="brand-sub mono">${t('gradeLbl')}: <strong style="color:var(--text-primary)">${escapeHtml(finalGrade)}</strong></span>
              <button type="button" class="btn btn-primary btn-sm" onclick="openProjectWorkspace('${proj.id}')">
                ${t('openPipelineBtn')}
              </button>
            </div>
          </div>
        `;
      }).join('') + (archivedCount ? `<div style="grid-column:1/-1"><button type="button" class="btn btn-sm" onclick="toggleShowArchived()">${escapeHtml(appState.showArchived ? t('hideArchived') : t('showArchived', archivedCount))}</button></div>` : '');
    }

    /* =========================================================================
       10. UNIFIED SPREADSHEET TIMELINE & MERGED TASK BARS
       ========================================================================= */
    function getCategoryDisplayName(cat) {
      if (cat.presetKey && I18N.sr[cat.presetKey]) {
        return t(cat.presetKey);
      }
      return cat.customName || 'Kategorija';
    }

    function getTaskDisplayName(task) {
      if (task.presetKey && I18N.sr[task.presetKey]) {
        return t(task.presetKey);
      }
      return task.customName || 'Zadatak';
    }

    function getStatusLabel(status) {
      if (status === 'Approved') return t('stApproved');
      if (status === 'Ready for Review') return t('stReview');
      if (status === 'In Progress') return t('stInProgress');
      return t('stNotStarted');
    }

    function getStatusShortPill(status, spanCount) {
      if (status === 'Approved') return '✓';
      if (status === 'Ready for Review') return '…';
      if (status === 'In Progress') return `${spanCount}d`;
      return `${spanCount}d`;
    }

    function dayKeyToColIndex(dayKey) {
      const parts = String(dayKey).split('-');
      if (parts.length !== 2) return -1;
      const w = Number(parts[0]);
      const d = Number(parts[1]);
      if (!Number.isFinite(w) || !Number.isFinite(d) || w < 1 || d < 0 || d > 6) return -1;
      return (w - 1) * 7 + d;
    }

    function colIndexToDayKey(colIdx) {
      const w = Math.floor(colIdx / 7) + 1;
      const d = colIdx % 7;
      return `${w}-${d}`;
    }

    function getCategoryDaySet(cat) {
      const set = new Set();
      (cat.tasks || []).forEach(tk => {
        (tk.scheduledDays || []).forEach(dk => {
          if (dayKeyToColIndex(dk) >= 0) set.add(dk);
        });
      });
      return set;
    }

    function renderWorkspace() {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!stu || !proj) return;

      const editable = canEditActiveProject();
      const isProf = appState.userType === 'professor';

      document.getElementById('ws-project-title').textContent = proj.name;
      document.getElementById('ws-project-meta').textContent =
        `${stu.name} (${stu.indexId}) · ${t('yearShort', stu.studyYear || 1)} · ${proj.animationType} · ${proj.length} · ${proj.driveFolderPath}`;

      const visBadge = document.getElementById('ws-visibility-badge');
      visBadge.className = `badge ${proj.isPublic ? 'badge-public' : 'badge-private'}`;
      visBadge.textContent = proj.isPublic ? t('publicLbl') : t('privateLbl');

      const finalGrade = (proj.grades && proj.grades.final) ? proj.grades.final : t('ungraded');
      document.getElementById('ws-grade-badge').textContent = `${stu ? stu.name + ' · ' : ''}${t('gradeLbl')}: ${finalGrade}`;

      const visToggleBtn = document.getElementById('ws-visibility-toggle');
      visToggleBtn.classList.toggle('hidden', !editable);
      visToggleBtn.textContent = proj.isPublic ? t('privateLbl') : t('publicLbl');
      const archBtn = document.getElementById('ws-archive-btn');
      const myArch = isProf ? proj.archivedByProf : proj.archivedByStudent;
      archBtn.textContent = myArch ? t('unarchiveBtn') : t('archiveBtn');

      document.getElementById('ws-add-week-btn').classList.toggle('hidden', !editable);
      document.getElementById('ws-back-projects-btn').classList.toggle('hidden', !editable);
      document.getElementById('ws-back-prof-btn').classList.toggle('hidden', !isProf);
      document.getElementById('ws-grade-btn').classList.toggle('hidden', !isProf);

      const folderLink = document.getElementById('ws-folder-link');
      const sheetLink = document.getElementById('ws-sheet-link');
      if (proj.driveFolderId) {
        folderLink.href = proj.driveFolderUrl || `https://drive.google.com/drive/folders/${proj.driveFolderId}`;
        folderLink.classList.remove('hidden');
      } else { folderLink.classList.add('hidden'); }
      if (proj.driveSheetId) {
        sheetLink.href = proj.driveSheetUrl || `https://docs.google.com/spreadsheets/d/${proj.driveSheetId}/edit`;
        sheetLink.classList.remove('hidden');
      } else { sheetLink.classList.add('hidden'); }
      document.getElementById('ws-sync-sheet-btn').classList.toggle('hidden', !editable || !proj.driveSheetId);

      const stats = computeProgressStats(proj);
      document.getElementById('ws-progress-pct').textContent = `${stats.approvedPct}% (${stats.approved}/${stats.total})`;
      document.getElementById('ws-progress-approved-bar').style.width = `${stats.approvedPct}%`;
      document.getElementById('ws-progress-review-bar').style.width = `${stats.reviewPct}%`;

      const revBadge = document.getElementById('ws-review-badge');
      if (stats.review > 0) {
        revBadge.classList.remove('hidden');
        revBadge.textContent = t('waitingBadge', stats.review);
      } else {
        revBadge.classList.add('hidden');
      }

      const noteBox = document.getElementById('ws-prof-note-box');
      if (proj.profNote && proj.profNote.trim()) {
        noteBox.classList.remove('hidden');
        document.getElementById('ws-prof-note-text').textContent = proj.profNote;
      } else {
        noteBox.classList.add('hidden');
      }

      renderTimelineTable(proj, editable);
    }

    function renderTimelineTable(proj, editable) {
      const table = document.getElementById('timeline-table');
      const isProf = appState.userType === 'professor';
      const totalWeeks = proj.totalWeeks || 4;
      const totalCols = totalWeeks * 7;
      const shortDays = t('daysShort');

      // Row 1 of header: Week 1..Week N
      let weekThHtml = `<th class="sticky-col" rowspan="2">${escapeHtml(t('colPipeline'))}</th>`;
      let dayThHtml = '';

      for (let w = 1; w <= totalWeeks; w++) {
        weekThHtml += `<th class="week-th" colspan="7">${escapeHtml(t('weekLbl'))} ${w}</th>`;
        for (let d = 0; d < 7; d++) {
          const isWeekend = d >= 5;
          dayThHtml += `<th class="day-th ${isWeekend ? 'weekend' : ''}">${escapeHtml(shortDays[d])}</th>`;
        }
      }

      const theadHtml = `<thead><tr>${weekThHtml}</tr><tr>${dayThHtml}</tr></thead>`;

      const phases = [
        { key: 'PRE', label: t('phasePre') },
        { key: 'PROD', label: t('phaseProd') },
        { key: 'POST', label: t('phasePost') }
      ];

      let tbodyHtml = '';

      phases.forEach(phase => {
        // Phase header row with inline "+" button to add a Category
        tbodyHtml += `
          <tr class="phase-row">
            <td class="sticky-col">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <button type="button" onclick="toggleCollapse('phase:${phase.key}')" style="background:none;border:0;padding:0;color:inherit;font:inherit;font-weight:inherit;display:inline-flex;align-items:center;gap:6px;cursor:pointer">
                  <span style="display:inline-flex;transform:rotate(${collapsedKeys.has('phase:' + phase.key) ? -90 : 0}deg)">${ic('chevron')}</span>
                  <span>${escapeHtml(phase.label)}</span>
                  ${(() => { const g = proj.grades && proj.grades[{ PRE: 'pre', PROD: 'prod', POST: 'post' }[phase.key]]; return g ? `<span class="badge mono" style="font-size:10px;padding:1px 6px">${escapeHtml(t('catGradeLbl'))}: ${escapeHtml(g)}</span>` : ''; })()}
                </button>
                ${editable ? `<button type="button" class="btn-icon" title="${escapeHtml(t('addCatTitle'))}" onclick="openAddCategoryModal('${phase.key}')">+</button>` : ''}
              </div>
            </td>
            <td colspan="${totalCols}"></td>
          </tr>
        `;
        if (collapsedKeys.has('phase:' + phase.key)) return;

        const phaseCats = proj.categories.filter(c => c.phase === phase.key);

        phaseCats.forEach(cat => {
          const catDaySet = getCategoryDaySet(cat);
          const catTitle = getCategoryDisplayName(cat);

          // Category row with auto-computed scheduled days count, "+" button to add a Task, and category span bar
          tbodyHtml += `
            <tr class="cat-row">
              <td class="sticky-col">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                  <div style="display:flex;align-items:center;gap:7px;overflow:hidden">
                    <button type="button" onclick="toggleCollapse('cat:${cat.id}')" style="background:none;border:0;padding:0;color:inherit;display:inline-flex;cursor:pointer;transform:rotate(${collapsedKeys.has('cat:' + cat.id) ? -90 : 0}deg)">${ic('chevron')}</button>
                    <span class="color-dot" style="background:${escapeHtml(cat.color || '#6366f1')}"></span>
                    <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(catTitle)}</span>
                    ${(cat.grade || isProf) ? `<span class="badge mono" style="font-size:10px;padding:1px 6px;${isProf ? 'cursor:pointer' : ''}" ${isProf ? `onclick="setCategoryGrade('${cat.id}')"` : ''}>${escapeHtml(t('catGradeLbl'))}: ${escapeHtml(cat.grade || '—')}</span>` : ''}
                  </div>
                  <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                    <span class="badge mono" style="font-size:10px;padding:1px 6px">${t('scheduledDaysCount', catDaySet.size)}</span>
                    ${editable ? `<button type="button" class="btn-icon" title="${escapeHtml(t('addTaskTitle'))}" onclick="openAddTaskModal('${cat.id}')">+</button>` : ''}
                  </div>
                </div>
              </td>
          `;

          // Render category overall span across columns (earliest to latest scheduled day in this category)
          let cCol = 0;
          while (cCol < totalCols) {
            const cKey = colIndexToDayKey(cCol);
            if (catDaySet.has(cKey)) {
              let span = 1;
              while (cCol + span < totalCols && catDaySet.has(colIndexToDayKey(cCol + span))) {
                span += 1;
              }
              tbodyHtml += `
                <td colspan="${span}" class="cat-span-cell">
                  <div class="cat-span-bar" style="background:${escapeHtml(cat.color || '#6366f1')};opacity:0.35">
                    <span>${escapeHtml(catTitle)}</span>
                    <span>${span}d</span>
                  </div>
                </td>
              `;
              cCol += span;
            } else {
              const dIdx = cCol % 7;
              tbodyHtml += `<td class="${dIdx >= 5 ? 'day-cell weekend' : 'day-cell'}"></td>`;
              cCol += 1;
            }
          }

          tbodyHtml += `</tr>`;

          // Task rows: consecutive scheduled days MERGE into a single bar with task label & status pill
          (collapsedKeys.has('cat:' + cat.id) ? [] : (cat.tasks || [])).forEach(task => {
            const tDaySet = new Set((task.scheduledDays || []).filter(dk => dayKeyToColIndex(dk) >= 0));
            const taskName = getTaskDisplayName(task);
            const mediaCount = (task.media || []).length;
            const commentCount = (task.comments || []).length;
            const openQCount = (task.comments || []).filter(c => c.question && !c.answered).length;

            let statusIcon = '';
            if (task.status === 'Approved') statusIcon = '✓ ';
            else if (task.status === 'Ready for Review') statusIcon = ic('hourglass') + ' ';

            tbodyHtml += `
              <tr class="task-row">
                <td class="sticky-col">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                    <button type="button" onclick="openTaskModal('${cat.id}', '${task.id}')" style="background:none;border:none;padding:0;text-align:left;font-size:12px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      ${statusIcon}${escapeHtml(taskName)}
                    </button>
                    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                      ${mediaCount > 0 ? `<span class="badge mono" style="font-size:10px;padding:1px 5px">${ic('clip')} ${mediaCount}</span>` : ''}
                      ${openQCount > 0 ? `<span class="badge mono" style="font-size:10px;padding:1px 5px;color:#fcd34d">${ic('question')} ${openQCount}</span>` : ''}
                      ${commentCount > 0 ? `<span class="badge mono" style="font-size:10px;padding:1px 5px">${ic('chat')} ${commentCount}</span>` : ''}
                      <span class="badge mono" style="font-size:10px;padding:1px 5px">${t('scheduledDaysCount', tDaySet.size)}</span>
                    </div>
                  </div>
                </td>
            `;

            let col = 0;
            while (col < totalCols) {
              const dk = colIndexToDayKey(col);
              if (tDaySet.has(dk)) {
                let span = 1;
                while (col + span < totalCols && tDaySet.has(colIndexToDayKey(col + span))) {
                  span += 1;
                }
                const pillText = getStatusShortPill(task.status, span);
                tbodyHtml += `
                  <td colspan="${span}" class="merged-cell">
                    <div class="merged-bar" style="background:${escapeHtml(cat.color || '#6366f1')}" title="${escapeHtml(taskName)} — ${escapeHtml(getStatusLabel(task.status))}" onclick="openTaskModal('${cat.id}', '${task.id}')">
                      <span class="merged-bar-title">${escapeHtml(taskName)}</span>
                      <span class="merged-bar-tag">${escapeHtml(pillText)}</span>
                    </div>
                  </td>
                `;
                col += span;
              } else {
                const dIdx = col % 7;
                const clickHandler = editable
                  ? `onclick="toggleTaskDay('${cat.id}', '${task.id}', '${dk}')"`
                  : `onclick="openTaskModal('${cat.id}', '${task.id}')"`;
                tbodyHtml += `<td class="day-cell ${dIdx >= 5 ? 'weekend' : ''}" ${clickHandler}></td>`;
                col += 1;
              }
            }

            tbodyHtml += `</tr>`;
          });
        });
      });

      table.innerHTML = `${theadHtml}<tbody>${tbodyHtml}</tbody>`;
    }

    function toggleTaskDay(catId, taskId, dayKey) {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      const task = cat ? cat.tasks.find(x => x.id === taskId) : null;
      if (!task) return;

      if (!Array.isArray(task.scheduledDays)) task.scheduledDays = [];
      const idx = task.scheduledDays.indexOf(dayKey);
      if (idx >= 0) {
        task.scheduledDays.splice(idx, 1);
      } else {
        task.scheduledDays.push(dayKey);
        if (task.status === 'Not Started') {
          task.status = 'In Progress';
        }
      }

      saveStudentsToStorage();
      renderWorkspace();
    }

    function removeTaskDay(catId, taskId, dayKey) {
      if (!canEditActiveProject()) return;
      const { task } = findTaskCtx(catId, taskId);
      if (!task || !Array.isArray(task.scheduledDays)) return;
      task.scheduledDays = task.scheduledDays.filter(dk => dk !== dayKey);
      saveStudentsToStorage();
      renderWorkspace();
      openTaskModal(catId, taskId);
    }

    function clearTaskDays(catId, taskId) {
      if (!canEditActiveProject()) return;
      const { task } = findTaskCtx(catId, taskId);
      if (!task) return;
      task.scheduledDays = [];
      saveStudentsToStorage();
      renderWorkspace();
      openTaskModal(catId, taskId);
    }

    function addWeekToProject() {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;
      proj.totalWeeks = (proj.totalWeeks || 4) + 1;
      saveStudentsToStorage();
      renderWorkspace();
      showToast(t('weekAdded'));
    }

    function updateAccountLabels() {
      const set = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
      set('account-btn-label', 'accountBtn'); set('acc-title', 'accountTitle'); set('acc-lang-lbl', 'langLbl');
      set('acc-pw-title', 'pwSection'); set('acc-pw-cur-lbl', 'pwCurrent'); set('acc-pw-new-lbl', 'pwNew');
      set('acc-pw-rep-lbl', 'pwRepeat'); set('acc-pw-save', 'pwSave');
      const sel = document.getElementById('acc-lang'); if (sel) sel.value = currentLang;
    }

    function openAccountModal() {
      updateAccountLabels();
      ['acc-pw-cur', 'acc-pw-new', 'acc-pw-rep'].forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('acc-error').classList.add('hidden');
      document.getElementById('account-modal').classList.remove('hidden');
    }

    async function handleChangePassword(e) {
      e.preventDefault();
      const err = document.getElementById('acc-error');
      const show = msg => { err.textContent = msg; err.classList.remove('hidden'); };
      err.classList.add('hidden');
      const cur = document.getElementById('acc-pw-cur').value;
      const nw = document.getElementById('acc-pw-new').value;
      if (nw !== document.getElementById('acc-pw-rep').value) return show(t('pwMismatch'));
      if (nw.length < 6) return show(t('pwShort'));
      try {
        const user = auth.currentUser;
        await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email, cur));
        await user.updatePassword(nw);
        closeModal('account-modal');
        showToast(t('pwChanged'));
      } catch (ex) {
        const code = (ex && ex.code) || '';
        if (code === 'auth/weak-password') show(t('pwShort'));
        else if (code.indexOf('wrong-password') >= 0 || code.indexOf('invalid-credential') >= 0) show(t('pwWrong'));
        else show(authErrMsg(ex));
      }
    }

    function isArchivedFor(proj, role) {
      if (!proj) return false;
      return role === 'professor' ? Boolean(proj.archivedByStudent || proj.archivedByProf) : Boolean(proj.archivedByStudent);
    }

    function toggleArchiveProject() {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;
      const key = appState.userType === 'professor' ? 'archivedByProf' : 'archivedByStudent';
      proj[key] = !proj[key];
      saveStudentsToStorage();
      showToast(t(proj[key] ? 'archivedToast' : 'unarchivedToast'));
      if (proj[key]) switchMainTab('projects'); else renderWorkspace();
    }

    function toggleShowArchived() { appState.showArchived = !appState.showArchived; renderAll(); }

    const collapsedKeys = new Set();
    function toggleCollapse(key) {
      if (collapsedKeys.has(key)) collapsedKeys.delete(key); else collapsedKeys.add(key);
      renderWorkspace();
    }

    function setCategoryGrade(catId) {
      if (appState.userType !== 'professor') return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      if (!cat) return;
      const v = window.prompt(t('catGradePrompt'), cat.grade || '');
      if (v === null) return;
      cat.grade = v.trim();
      saveStudentsToStorage();
      renderWorkspace();
    }

    function toggleProjectVisibility() {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;
      proj.isPublic = !proj.isPublic;
      saveStudentsToStorage();
      renderWorkspace();
    }

    /* =========================================================================
       11. ADD CATEGORY & ADD TASK MODALS
       ========================================================================= */
    function openAddCategoryModal(phaseKey) {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;

      activeAddContext = { type: 'category', phase: phaseKey };
      document.getElementById('ai-modal-title').textContent = t('addCatTitle');
      document.getElementById('ai-modal-sub').textContent = proj.name;
      document.getElementById('ai-color-group').classList.remove('hidden');

      const presets = CATEGORY_PRESETS[phaseKey] || [];
      const presetSel = document.getElementById('ai-preset');
      presetSel.innerHTML =
        presets.map(p => `<option value="${p.key}" data-color="${p.color}">${escapeHtml(t(p.key))}</option>`).join('') +
        `<option value="__custom__" data-color="#6366f1">${escapeHtml(t('customOpt'))}</option>`;

      presetSel.value = presets[0] ? presets[0].key : '__custom__';
      onPresetChange();
      document.getElementById('add-item-modal').classList.remove('hidden');
    }

    function openAddTaskModal(catId) {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      if (!cat) return;

      activeAddContext = { type: 'task', catId: cat.id };
      document.getElementById('ai-modal-title').textContent = t('addTaskTitle');
      document.getElementById('ai-modal-sub').textContent = getCategoryDisplayName(cat);
      document.getElementById('ai-color-group').classList.add('hidden');

      const taskKeys = (cat.presetKey && TASK_PRESETS[cat.presetKey]) ? TASK_PRESETS[cat.presetKey] : [];
      const presetSel = document.getElementById('ai-preset');
      presetSel.innerHTML =
        taskKeys.map(k => `<option value="${k}">${escapeHtml(t(k))}</option>`).join('') +
        `<option value="__custom__">${escapeHtml(t('customOpt'))}</option>`;

      presetSel.value = taskKeys[0] || '__custom__';
      onPresetChange();
      document.getElementById('add-item-modal').classList.remove('hidden');
    }

    function onPresetChange() {
      if (!activeAddContext) return;
      const presetSel = document.getElementById('ai-preset');
      const nameInput = document.getElementById('ai-name');
      const val = presetSel.value;

      if (val === '__custom__') {
        nameInput.value = '';
        nameInput.focus();
      } else {
        nameInput.value = t(val);
        if (activeAddContext.type === 'category') {
          const opt = presetSel.options[presetSel.selectedIndex];
          const c = opt ? opt.getAttribute('data-color') : '#6366f1';
          document.getElementById('ai-color').value = c || '#6366f1';
        }
      }
    }

    function handleAddItemSubmit(e) {
      e.preventDefault();
      if (!activeAddContext || !canEditActiveProject()) return;

      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;

      const presetVal = document.getElementById('ai-preset').value;
      const rawName = document.getElementById('ai-name').value.trim();
      if (!rawName) return;

      if (activeAddContext.type === 'category') {
        const color = document.getElementById('ai-color').value || '#6366f1';
        const isPreset = presetVal !== '__custom__' && I18N.sr[presetVal] && t(presetVal) === rawName;
        proj.categories.push({
          id: 'cat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          phase: activeAddContext.phase,
          presetKey: isPreset ? presetVal : '',
          customName: isPreset ? '' : rawName,
          color,
          tasks: []
        });
        saveStudentsToStorage();
        closeModal('add-item-modal');
        renderWorkspace();
        showToast(t('catAdded'));
      } else if (activeAddContext.type === 'task') {
        const cat = proj.categories.find(c => c.id === activeAddContext.catId);
        if (!cat) return;
        const isPreset = presetVal !== '__custom__' && I18N.sr[presetVal] && t(presetVal) === rawName;
        cat.tasks.push({
          id: 'tk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
          presetKey: isPreset ? presetVal : '',
          customName: isPreset ? '' : rawName,
          status: 'Not Started',
          reviewerProfId: '',
          scheduledDays: [],
          media: [],
          comments: []
        });
        saveStudentsToStorage();
        closeModal('add-item-modal');
        renderWorkspace();
        showToast(t('taskAdded'));
      }
    }

    /* =========================================================================
       12. TASK MODAL: DAYS, MEDIA UPLOAD, REVIEWER & APPROVAL, COMMENTS
       ========================================================================= */
    let replyTargetId = null; // professor: id of question being answered

    function findTaskCtx(catId, taskId) {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      const task = cat ? cat.tasks.find(x => x.id === taskId) : null;
      return { stu, proj, cat, task };
    }

    function profName(id) {
      const p = PROFESSORS.find(x => x.id === id);
      return p ? p.name : '—';
    }

    function renderCommentsHtml(cat, task, isProf) {
      const list = task.comments || [];
      if (list.length === 0) {
        return `<div class="brand-sub" style="margin-bottom:8px">${escapeHtml(t('noComments'))}</div>`;
      }
      const myId = appState.currentUser ? appState.currentUser.id : '';
      const ids = new Set(list.map(c => c.id).filter(Boolean));
      const tops = list.filter(c => !c.replyTo || !ids.has(c.replyTo));

      const card = (c, isReply) => {
        const isQ = Boolean(c.question);
        const badge = isQ
          ? `<span class="q-badge ${c.answered ? 'done' : ''}">${escapeHtml(t('questionFor', profName(c.toProfId)))} · ${escapeHtml(c.answered ? t('answeredLbl') : t('awaitingAnswer'))}</span>`
          : '';
        const canReply = isProf && isQ && c.toProfId === myId && !c.answered;
        return `
          <div class="comment-card ${isQ ? 'question' : ''} ${isReply ? 'comment-reply' : ''}">
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;flex-wrap:wrap">
              <strong>${escapeHtml(c.author)}</strong>
              <span class="brand-sub mono">${escapeHtml(c.time)}</span>
            </div>
            ${badge ? `<div style="margin-top:4px">${badge}</div>` : ''}
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;white-space:pre-wrap">${escapeHtml(c.text)}</div>
            ${canReply ? `<button type="button" class="btn btn-sm btn-primary" style="margin-top:6px" onclick="setReplyTarget('${c.id}')">${escapeHtml(t('replyBtn'))}</button>` : ''}
          </div>`;
      };

      return tops.map(c => {
        const replies = c.id ? list.filter(r => r.replyTo === c.id) : [];
        return card(c, false) + replies.map(r => card(r, true)).join('');
      }).join('');
    }

    function openTaskModal(catId, taskId) {
      const { stu, proj, cat, task } = findTaskCtx(catId, taskId);
      if (!stu || !proj || !cat || !task) return;

      normalizeProject(proj);
      const sameTask = activeTaskModalIds && activeTaskModalIds.taskId === taskId;
      activeTaskModalIds = { catId, taskId };

      const editable = canEditActiveProject();
      const isProf = appState.userType === 'professor';

      // Professor opening the task = questions addressed to them are now read
      if (isProf && appState.currentUser) {
        let changed = false;
        (task.comments || []).forEach(c => {
          if (c.question && c.toProfId === appState.currentUser.id && !c.read) { c.read = true; changed = true; }
        });
        if (changed) saveStudentsToStorage();
      }

      document.getElementById('td-meta').textContent =
        `${getCategoryDisplayName(cat)} · ${proj.driveFolderPath}`;
      document.getElementById('td-title').textContent = getTaskDisplayName(task);

      const statuses = ['Not Started', 'In Progress', 'Ready for Review', 'Approved'];
      const statusKeys = {
        'Not Started': 'stNotStarted',
        'In Progress': 'stInProgress',
        'Ready for Review': 'stReview',
        'Approved': 'stApproved'
      };

      const showReviewer = task.status === 'Ready for Review' || Boolean(task.reviewerProfId);
      const selectedReviewer = task.reviewerProfId || (PROFESSORS[0] ? PROFESSORS[0].id : '');
      const mediaList = task.media || [];

      const composeHtml = isProf
        ? `
          <div id="td-reply-banner" class="brand-sub" style="margin-bottom:6px;display:none"></div>
          <textarea id="td-comment-input" rows="2" class="textarea" placeholder="${escapeHtml(t('replyPlaceholder'))}"></textarea>`
        : `
          <select id="td-comment-to" class="select" style="margin-bottom:8px">
            <option value="">${escapeHtml(t('toGeneral'))}</option>
            ${PROFESSORS.map(p => `<option value="${p.id}">${escapeHtml(t('toProfQuestion', p.name))}</option>`).join('')}
          </select>
          <textarea id="td-comment-input" rows="2" class="textarea" placeholder="${escapeHtml(t('questionPlaceholder'))}"></textarea>`;

      document.getElementById('td-body').innerHTML = `
        <div class="grid-2">
          <div class="field-group">
            <label class="field-label">${escapeHtml(t('statusLbl'))}</label>
            <select class="select" onchange="changeTaskStatus('${cat.id}', '${task.id}', this.value)">
              ${statuses.map(st => `<option value="${st}" ${task.status === st ? 'selected' : ''}>${escapeHtml(t(statusKeys[st]))}</option>`).join('')}
            </select>
          </div>

          <div class="field-group ${showReviewer ? '' : 'hidden'}">
            <label class="field-label">${escapeHtml(t('reviewerLbl'))}</label>
            <select class="select" onchange="changeTaskReviewer('${cat.id}', '${task.id}', this.value)">
              ${PROFESSORS.map(p => `<option value="${p.id}" ${selectedReviewer === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        ${(isProf && task.status !== 'Approved') ? `
          <div style="margin-bottom:14px">
            <button type="button" class="btn btn-success" style="width:100%" onclick="approveTaskNow('${cat.id}', '${task.id}')">
              ✓ ${escapeHtml(t('approveNowBtn'))}
            </button>
          </div>
        ` : ''}

        <div class="panel" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <div class="field-label" style="margin:0">${escapeHtml(t('daysSectionLbl'))}</div>
            ${(editable && (task.scheduledDays || []).length) ? `<button type="button" class="btn btn-sm btn-danger" onclick="clearTaskDays('${cat.id}', '${task.id}')">${escapeHtml(t('daysClearAll'))}</button>` : ''}
          </div>
          ${(() => {
            const keys = (task.scheduledDays || []).filter(dk => dayKeyToColIndex(dk) >= 0)
              .sort((a, b) => dayKeyToColIndex(a) - dayKeyToColIndex(b));
            if (!keys.length) return `<div class="brand-sub">${escapeHtml(t('daysNone'))}</div>`;
            const names = t('dayNames');
            return `<div style="display:flex;flex-wrap:wrap;gap:6px">${keys.map(dk => {
              const [w, d] = dk.split('-').map(Number);
              const label = `${t('weekLbl')} ${w} · ${names[d]}`;
              return `<span class="badge mono" style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px">${escapeHtml(label)}${editable ? `<button type="button" title="${escapeHtml(t('dayRemove'))}" style="background:none;border:0;padding:0;color:inherit;cursor:pointer;font-size:14px;line-height:1" onclick="removeTaskDay('${cat.id}', '${task.id}', '${dk}')">×</button>` : ''}</span>`;
            }).join('')}</div>`;
          })()}
        </div>

        <div class="panel" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
            <div>
              <div class="field-label" style="margin:0">${escapeHtml(t('mediaSectionLbl'))}</div>
              <div class="brand-sub mono" style="color:#93c5fd">${escapeHtml(proj.driveFolderPath)}</div>
            </div>
            ${editable ? `
              <label class="btn btn-sm btn-primary" style="cursor:pointer">
                ${escapeHtml(t('uploadMediaBtn'))}
                <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="onUploadTaskMedia(event, '${cat.id}', '${task.id}')" />
              </label>
            ` : ''}
          </div>

          ${mediaList.length === 0
            ? `<div class="brand-sub" style="margin-top:8px">${escapeHtml(t('noMedia'))}</div>`
            : `<div class="media-grid">
                ${mediaList.map((item, idx) => `
                  <div class="media-card">
                    <div class="media-thumb" title="${escapeHtml(t('mediaOpenHint'))}" onclick="openLightbox('${cat.id}', '${task.id}', ${idx})">
                      ${mediaCardInner(item)}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                      <span class="brand-sub mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(item.name)}</span>
                      ${editable ? `<button type="button" class="btn btn-sm btn-danger" style="padding:2px 6px" onclick="deleteTaskMedia('${cat.id}', '${task.id}', ${idx})">✕</button>` : ''}
                    </div>
                    <div class="brand-sub mono" style="font-size:10px;color:#86efac">${escapeHtml(item.drivePath)}</div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>

        <div class="panel">
          <div class="field-label">${escapeHtml(t('commentsLbl'))}</div>
          ${renderCommentsHtml(cat, task, isProf)}

          <div style="margin-top:8px">
            ${composeHtml}
            <button type="button" class="btn btn-primary btn-sm" style="margin-top:8px" onclick="submitTaskComment('${cat.id}', '${task.id}')">
              ${escapeHtml(t('postCommentBtn'))}
            </button>
          </div>
        </div>
      `;

      if (!sameTask) replyTargetId = null;
      document.getElementById('task-detail-modal').classList.remove('hidden');
      if (replyTargetId && isProf) setReplyTarget(replyTargetId);
      updateNotifBell();
    }

    function setReplyTarget(commentId) {
      replyTargetId = commentId;
      const banner = document.getElementById('td-reply-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.innerHTML = `↩ ${escapeHtml(t('replyingTo'))} <button type="button" class="btn btn-sm" style="margin-left:6px;padding:1px 6px" onclick="clearReplyTarget()">${escapeHtml(t('cancelReply'))}</button>`;
      }
      const input = document.getElementById('td-comment-input');
      if (input) input.focus();
    }

    function clearReplyTarget() {
      replyTargetId = null;
      const banner = document.getElementById('td-reply-banner');
      if (banner) banner.style.display = 'none';
    }

    function changeTaskStatus(catId, taskId, newStatus) {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      const task = cat ? cat.tasks.find(x => x.id === taskId) : null;
      if (!task) return;

      task.status = newStatus;
      if (newStatus === 'Ready for Review' && !task.reviewerProfId) {
        task.reviewerProfId = PROFESSORS[0] ? PROFESSORS[0].id : '';
      }
      saveStudentsToStorage();
      renderWorkspace();
      if (appState.userType === 'professor') renderProfessorDashboard();
      openTaskModal(catId, taskId);
    }

    function changeTaskReviewer(catId, taskId, profId) {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      const task = cat ? cat.tasks.find(x => x.id === taskId) : null;
      if (!task) return;
      task.reviewerProfId = profId;
      saveStudentsToStorage();
      if (appState.userType === 'professor') renderProfessorDashboard();
    }

    function approveTaskNow(catId, taskId) {
      changeTaskStatus(catId, taskId, 'Approved');
      showToast(t('taskApprovedMsg'));
    }

    function mediaCardInner(item) {
      const isVideo = item.type === 'video';
      if (item.driveFileId || !isVideo) {
        return `<img class="media-preview" loading="lazy" src="${escapeHtml(mediaThumbUrl(item, 500))}" alt="${escapeHtml(item.name)}" />` +
               (isVideo ? '<div class="play-badge">▶</div>' : '');
      }
      return `<video class="media-preview" src="${escapeHtml(item.url)}" preload="metadata" muted playsinline></video><div class="play-badge">▶</div>`;
    }

    function onUploadTaskMedia(event, catId, taskId) {
      if (!canEditActiveProject()) return;
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length === 0) return;

      let tokenP;
      try { tokenP = getDriveToken(); } catch (err) { showToast(err.message); return; }  // sync: keeps the user gesture

      const first = findTaskCtx(catId, taskId);
      if (!first.proj || !first.task) return;
      if (!first.proj.assetsFolderId) { showToast(t('noAssetsFolder')); return; }

      (async () => {
        try {
          await tokenP;
          showToast(t('uploading', files.length));
          // per-task subfolder inside "Assets & Media"
          let taskFolderId = first.task.driveFolderId;
          if (!taskFolderId) {
            const folderName = `${getCategoryDisplayName(first.cat)} - ${getTaskDisplayName(first.task)}`.replace(/[\\/]/g, '-');
            const f = await driveCreateFolder(folderName, first.proj.assetsFolderId);
            taskFolderId = f.id;
          }
          const uploaded = [];
          for (const file of files) {
            const meta = await driveUpload(file, taskFolderId);
            const mime = meta.mimeType || file.type || '';
            uploaded.push({
              id: 'med-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
              name: meta.name,
              type: mime.indexOf('video/') === 0 ? 'video' : 'image',
              mimeType: mime,
              driveFileId: meta.id,
              webViewLink: meta.webViewLink || '',
              thumbnailLink: meta.thumbnailLink || '',
              drivePath: `${first.proj.driveFolderPath}/Assets & Media/${meta.name}`,
              uploadedAt: Date.now()
            });
          }
          // re-resolve: a snapshot may have replaced the objects while uploading
          const ctx = findTaskCtx(catId, taskId);
          if (!ctx.task) return;
          ctx.task.driveFolderId = taskFolderId;
          if (!Array.isArray(ctx.task.media)) ctx.task.media = [];
          uploaded.forEach(m => ctx.task.media.push(m));
          saveStudentsToStorage();
          renderWorkspace();
          openTaskModal(catId, taskId);
          showToast(t('mediaUploaded'));
        } catch (err) {
          console.error(err);
          showToast(t('driveErr') + ' ' + err.message);
        }
      })();
    }

    function deleteTaskMedia(catId, taskId, idx) {
      if (!canEditActiveProject()) return;
      const { task } = findTaskCtx(catId, taskId);
      if (!task || !Array.isArray(task.media)) return;
      const item = task.media[idx];
      task.media.splice(idx, 1);
      saveStudentsToStorage();
      renderWorkspace();
      openTaskModal(catId, taskId);
      if (item && item.driveFileId && driveTokenValid()) {
        driveFetch(`${DRIVE_FILES}/${item.driveFileId}`, { method: 'DELETE' }).catch(err => console.warn('drive delete', err));
      }
    }

    function submitTaskComment(catId, taskId) {
      const input = document.getElementById('td-comment-input');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const { task } = findTaskCtx(catId, taskId);
      if (!task) return;

      const isProf = appState.userType === 'professor';
      const toSel = document.getElementById('td-comment-to');
      const toProfId = (!isProf && toSel) ? toSel.value : '';

      if (!Array.isArray(task.comments)) task.comments = [];
      const authorName = appState.currentUser ? appState.currentUser.name : 'Korisnik';
      const now = new Date();
      const nowStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' +
                     now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const comment = {
        id: 'cm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        author: authorName,
        authorId: appState.currentUser ? appState.currentUser.id : '',
        authorRole: appState.userType,
        time: nowStr,
        ts: now.getTime(),
        text,
        question: Boolean(toProfId),
        toProfId: toProfId || '',
        read: false,
        answered: false,
        replyTo: (isProf && replyTargetId) ? replyTargetId : null
      };
      task.comments.push(comment);

      if (comment.replyTo) {
        const parent = task.comments.find(c => c.id === comment.replyTo);
        if (parent) { parent.answered = true; parent.read = true; }
      }

      saveStudentsToStorage();
      renderWorkspace();
      if (isProf) renderProfessorDashboard();
      openTaskModal(catId, taskId);
      if (comment.replyTo) showToast(t('replySent')); else if (comment.question) showToast(t('questionSent'));
    }

    /* =========================================================================
       12b. FULLSCREEN LIGHTBOX FOR IMAGES / VIDEOS
       ========================================================================= */
    let lightboxState = null; // { catId, taskId, idx }

    function openLightbox(catId, taskId, idx) {
      const { task } = findTaskCtx(catId, taskId);
      if (!task || !task.media || !task.media[idx]) return;
      lightboxState = { catId, taskId, idx };
      renderLightbox();
      document.getElementById('lightbox').classList.remove('hidden');
    }

    function renderLightbox() {
      if (!lightboxState) return;
      const { task } = findTaskCtx(lightboxState.catId, lightboxState.taskId);
      const list = task ? (task.media || []) : [];
      const item = list[lightboxState.idx];
      if (!item) { closeLightbox(); return; }
      const stage = document.getElementById('lb-stage');
      if (item.type === 'video') {
        stage.innerHTML = item.driveFileId
          ? `<iframe src="https://drive.google.com/file/d/${encodeURIComponent(item.driveFileId)}/preview" allow="autoplay; fullscreen" allowfullscreen></iframe>`
          : `<video src="${escapeHtml(item.url)}" controls autoplay playsinline></video>`;
      } else {
        stage.innerHTML = `<img src="${escapeHtml(mediaThumbUrl(item, 2400))}" alt="${escapeHtml(item.name)}" />`;
      }
      const driveUrl = mediaDriveUrl(item);
      document.getElementById('lb-open-drive').innerHTML = driveUrl
        ? `<a href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener" style="color:inherit">${escapeHtml(t('openOnDrive'))} ↗</a>` : '';
      document.getElementById('lb-caption').textContent =
        `${item.name}  ·  ${lightboxState.idx + 1} / ${list.length}`;
      const multi = list.length > 1;
      document.getElementById('lb-prev').style.display = multi ? '' : 'none';
      document.getElementById('lb-next').style.display = multi ? '' : 'none';
    }

    function lightboxStep(delta) {
      if (!lightboxState) return;
      const { task } = findTaskCtx(lightboxState.catId, lightboxState.taskId);
      const n = task && task.media ? task.media.length : 0;
      if (n === 0) return;
      lightboxState.idx = (lightboxState.idx + delta + n) % n;
      renderLightbox();
    }

    function closeLightbox() {
      lightboxState = null;
      const lb = document.getElementById('lightbox');
      lb.classList.add('hidden');
      document.getElementById('lb-stage').innerHTML = ''; // stops video playback
    }

    document.addEventListener('keydown', function (e) {
      if (!lightboxState) return;
      if (e.key === 'Escape') { closeLightbox(); e.stopPropagation(); }
      else if (e.key === 'ArrowLeft') lightboxStep(-1);
      else if (e.key === 'ArrowRight') lightboxStep(1);
    });

    /* =========================================================================
       12c. PROFESSOR INBOX — ONE ENTRY PER PROJECT (approvals + questions)
       ========================================================================= */
    const openInbox = new Set();

    function collectProfInbox(profId, studentList) {
      const groups = [];
      (studentList || studentsData).forEach(stu => {
        (stu.projects || []).forEach(raw => {
          if (isArchivedFor(raw, 'professor')) return;
          const proj = normalizeProject(raw);
          const approvals = [];
          const questions = [];
          proj.categories.forEach(cat => cat.tasks.forEach(tk => {
            if (tk.status === 'Ready for Review' && (!tk.reviewerProfId || tk.reviewerProfId === profId)) {
              approvals.push({ cat, tk });
            }
            (tk.comments || []).forEach(c => {
              if (c.question && c.toProfId === profId && !c.answered) questions.push({ cat, tk, c });
            });
          }));
          if (approvals.length || questions.length) {
            groups.push({ stu, proj, approvals, questions, unread: questions.some(q => !q.c.read) });
          }
        });
      });
      groups.sort((a, b) => a.stu.name.localeCompare(b.stu.name));
      return groups;
    }

    function toggleInboxGroup(key, isOpen) {
      if (isOpen) openInbox.add(key); else openInbox.delete(key);
    }

    function inboxGroupsHtml(groups, scope) {
      return groups.map(g => {
        const key = scope + ':' + g.proj.id;
        const badges = [
          g.approvals.length ? `<span class="badge badge-review">${ic('hourglass')} ${escapeHtml(t('inboxApprovals', g.approvals.length))}</span>` : '',
          g.questions.length ? `<span class="q-badge">${ic('question')} ${escapeHtml(t('inboxQuestions', g.questions.length))}</span>` : ''
        ].join(' ');
        const open = (stuId, projId, catId, tkId) => `openQuestionTask('${stuId}', '${projId}', '${catId}', '${tkId}')`;
        const rows = [
          ...g.approvals.map(a => `
            <div class="inbox-row">
              <div>${ic('hourglass')} ${escapeHtml(getCategoryDisplayName(a.cat))} / <strong>${escapeHtml(getTaskDisplayName(a.tk))}</strong></div>
              <button type="button" class="btn btn-primary btn-sm" onclick="${open(g.stu.id, g.proj.id, a.cat.id, a.tk.id)}">${escapeHtml(t('openTaskBtn'))}</button>
            </div>`),
          ...g.questions.map(q => {
            const snippet = q.c.text.length > 80 ? q.c.text.slice(0, 80) + '…' : q.c.text;
            return `
            <div class="inbox-row">
              <div>${q.c.read ? '' : '<span class="new-dot"></span>'}${ic('question')} ${escapeHtml(getCategoryDisplayName(q.cat))} / <strong>${escapeHtml(getTaskDisplayName(q.tk))}</strong>
                <div class="brand-sub" style="margin-top:2px">${escapeHtml(snippet)}</div></div>
              <button type="button" class="btn btn-primary btn-sm" onclick="${open(g.stu.id, g.proj.id, q.cat.id, q.tk.id)}">${escapeHtml(t('openTaskBtn'))}</button>
            </div>`;
          })
        ].join('');
        return `
          <details class="inbox-group" ${openInbox.has(key) ? 'open' : ''} ontoggle="toggleInboxGroup('${key}', this.open)">
            <summary>
              <span>${g.unread ? '<span class="new-dot"></span>' : ''}<strong>${escapeHtml(g.stu.name)}</strong>
                <span class="brand-sub mono">(${escapeHtml(g.stu.indexId)} · ${escapeHtml(t('yearShort', g.stu.studyYear || 1))})</span>
                — ${escapeHtml(g.proj.name)}</span>
              <span>${badges}</span>
            </summary>
            <div class="inbox-items">${rows}</div>
          </details>`;
      }).join('');
    }

    function updateNotifBell() {
      const wrap = document.getElementById('notif-wrap');
      if (!wrap) return;
      if (appState.userType !== 'professor' || !appState.currentUser) {
        wrap.classList.add('hidden');
        return;
      }
      wrap.classList.remove('hidden');
      const groups = collectProfInbox(appState.currentUser.id);
      const badge = document.getElementById('notif-badge');
      badge.textContent = groups.length;
      badge.classList.toggle('hidden', groups.length === 0);
      document.getElementById('notif-btn').classList.toggle('has-new', groups.some(g => g.unread));
      document.getElementById('notif-btn').title = t('inboxTitle');

      document.getElementById('notif-panel').innerHTML = `
        <div class="field-label" style="margin:0 0 8px">${escapeHtml(t('inboxTitle'))} (${groups.length})</div>
        ${groups.length === 0 ? `<div class="brand-sub">${escapeHtml(t('noNotifs'))}</div>` : inboxGroupsHtml(groups, 'bell')}
      `;
    }

    function toggleNotifPanel(e) {
      if (e) e.stopPropagation();
      document.getElementById('notif-panel').classList.toggle('hidden');
    }

    document.addEventListener('click', function (e) {
      const wrap = document.getElementById('notif-wrap');
      const panel = document.getElementById('notif-panel');
      if (panel && wrap && !wrap.contains(e.target)) panel.classList.add('hidden');
    });

    function openQuestionTask(studentId, projectId, catId, taskId) {
      document.getElementById('notif-panel').classList.add('hidden');
      openStudentTaskFromQueue(studentId, projectId, catId, taskId);
    }

    /* =========================================================================
       13. PROFESSOR DASHBOARD (BY STUDY YEAR 1-4), APPROVAL QUEUE & GRADING
       ========================================================================= */
    function renderProfessorDashboard() {
      const years = ['ALL', '1', '2', '3', '4'];
      const tabsWrap = document.getElementById('prof-year-tabs');

      tabsWrap.innerHTML = years.map(y => {
        const active = appState.profYearFilter === y;
        const label = y === 'ALL' ? t('allYears') : t('yearShort', y);
        return `
          <button type="button" class="btn btn-sm ${active ? 'btn-primary' : ''}" onclick="selectProfYear('${y}')">
            ${escapeHtml(label)}
          </button>
        `;
      }).join('');

      const filteredStudents = appState.profYearFilter === 'ALL'
        ? studentsData
        : studentsData.filter(s => String(s.studyYear || 1) === appState.profYearFilter);

      // Inbox: ONE entry per project (pending approvals + questions); disappears when resolved
      const queueBox = document.getElementById('prof-approval-queue');
      const groups = collectProfInbox(appState.currentUser ? appState.currentUser.id : '', filteredStudents);
      if (groups.length > 0) {
        queueBox.classList.remove('hidden');
        queueBox.innerHTML = `
          <h3 style="margin:0 0 10px;font-size:14px;font-weight:600;color:#fcd34d">${ic('inbox')} ${escapeHtml(t('inboxTitle'))} (${groups.length})</h3>
          ${inboxGroupsHtml(groups, 'dash')}
        `;
      } else {
        queueBox.classList.add('hidden');
      }
      updateNotifBell();

      // Render students grid for chosen study year
      const grid = document.getElementById('prof-students-grid');
      if (filteredStudents.length === 0) {
        grid.innerHTML = `
          <div class="card" style="grid-column:1/-1;text-align:center;color:var(--text-secondary)">
            ${escapeHtml(t('noStudentsYear'))}
          </div>
        `;
        return;
      }

      grid.innerHTML = filteredStudents.map(stu => {
        const visProj = (stu.projects || []).find(p => !isArchivedFor(p, 'professor'));
        const proj = visProj ? normalizeProject(visProj) : null;
        const stats = computeProgressStats(proj);
        const finalGrade = (proj && proj.grades && proj.grades.final) ? proj.grades.final : t('ungraded');

        return `
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
            <div>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <h3 style="margin:0;font-size:15px;font-weight:600">${escapeHtml(stu.name)}</h3>
                  <div class="brand-sub mono">${escapeHtml(stu.indexId)} · ${escapeHtml(t('yearShort', stu.studyYear || 1))}</div>
                </div>
                <span class="badge ${proj && proj.isPublic ? 'badge-public' : 'badge-private'}">
                  ${proj ? (proj.isPublic ? t('publicLbl') : t('privateLbl')) : '—'}
                </span>
              </div>

              <div class="brand-sub" style="margin-top:10px">
                ${proj ? escapeHtml(proj.name) : '—'}
              </div>
              <div class="brand-sub mono" style="margin-top:2px;color:#93c5fd">
                ${proj ? escapeHtml(proj.driveFolderPath) : 'Animation Pipeline'}
              </div>

              <div style="margin-top:10px">
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:var(--text-secondary)">${escapeHtml(t('approvedProgressLbl'))} (${stats.approved}/${stats.total})</span>
                  <span class="mono" style="color:#86efac">${stats.approvedPct}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill-approved" style="width:${stats.approvedPct}%"></div>
                  <div class="progress-fill-review" style="width:${stats.reviewPct}%"></div>
                </div>
                ${stats.review > 0 ? `<div style="margin-top:6px"><span class="badge badge-review">${escapeHtml(t('waitingBadge', stats.review))}</span></div>` : ''}
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border-subtle)">
              <span class="brand-sub mono">${escapeHtml(t('gradeLbl'))}: <strong style="color:var(--text-primary)">${escapeHtml(finalGrade)}</strong></span>
              ${proj
                ? `<button type="button" class="btn btn-primary btn-sm" onclick="inspectStudentProject('${stu.id}', '${proj.id}')">${escapeHtml(t('inspectStudentBtn'))}</button>`
                : `<span class="brand-sub">—</span>`
              }
            </div>
          </div>
        `;
      }).join('');
    }

    function selectProfYear(yearKey) {
      appState.profYearFilter = yearKey;
      renderProfessorDashboard();
    }

    function inspectStudentProject(studentId, projectId) {
      appState.inspectStudentId = studentId;
      appState.activeProjectId = projectId;
      appState.activeTab = 'workspace';
      renderAll();
    }

    function openStudentTaskFromQueue(studentId, projectId, catId, taskId) {
      appState.inspectStudentId = studentId;
      appState.activeProjectId = projectId;
      appState.activeTab = 'workspace';
      renderAll();
      openTaskModal(catId, taskId);
    }

    function openGradingModal() {
      if (appState.userType !== 'professor') return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!stu || !proj) return;

      document.getElementById('gm-sub').textContent = `${stu.name} (${stu.indexId}) — ${proj.name}`;
      document.getElementById('gm-pre').value = (proj.grades && proj.grades.pre) || '';
      document.getElementById('gm-prod').value = (proj.grades && proj.grades.prod) || '';
      document.getElementById('gm-post').value = (proj.grades && proj.grades.post) || '';
      document.getElementById('gm-final').value = (proj.grades && proj.grades.final) || '';
      document.getElementById('gm-note').value = proj.profNote || '';
      document.getElementById('grading-modal').classList.remove('hidden');
    }

    function handleSaveGrades(e) {
      e.preventDefault();
      if (appState.userType !== 'professor') return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;

      proj.grades = {
        pre: document.getElementById('gm-pre').value.trim(),
        prod: document.getElementById('gm-prod').value.trim(),
        post: document.getElementById('gm-post').value.trim(),
        final: document.getElementById('gm-final').value.trim()
      };
      proj.profNote = document.getElementById('gm-note').value.trim();

      saveStudentsToStorage();
      closeModal('grading-modal');
      renderWorkspace();
      showToast(t('gradesSaved'));
    }

    /* =========================================================================
       13b. SETTINGS (ADMIN): REGISTER PROFESSORS + DEFAULT PROJECT TEMPLATE
       ========================================================================= */
    function openAdminGate() {
      document.getElementById('ag-user').value = '';
      document.getElementById('ag-pass').value = '';
      document.getElementById('ag-error').classList.add('hidden');
      document.getElementById('admin-gate-modal').classList.remove('hidden');
      document.getElementById('ag-user').focus();
    }

    function handleAdminGate(e) {
      e.preventDefault();
      const u = document.getElementById('ag-user').value.trim();
      const p = document.getElementById('ag-pass').value;
      if (u === ADMIN_USER && p === ADMIN_PASS) {
        closeModal('admin-gate-modal');
        appState.adminOpen = true;
        adminTplDraft = JSON.parse(JSON.stringify(getTemplate()));
        renderAll();
      } else {
        const box = document.getElementById('ag-error');
        box.textContent = t('adminBadErr');
        box.classList.remove('hidden');
      }
    }

    function closeSettings() {
      appState.adminOpen = false;
      adminTplDraft = null;
      renderAll();
    }

    function renderSettings() {
      document.getElementById('settings-title').textContent = t('settingsBtn');
      document.getElementById('settings-sub').textContent = t('settingsSub');
      document.getElementById('settings-back-btn').textContent = t('settingsBack');
      document.getElementById('settings-prof-title').textContent = t('profSectionTitle');
      document.getElementById('settings-prof-sub').textContent = t('profSectionSub');
      document.getElementById('lbl-pr-name').textContent = t('prName') + ' *';
      document.getElementById('lbl-pr-title').textContent = t('prTitle');
      document.getElementById('lbl-pr-email').textContent = t('prEmail') + ' *';
      document.getElementById('lbl-pr-pass').textContent = t('prPass');
      document.getElementById('btn-pr-submit').textContent = t('prRegisterBtn');
      document.getElementById('settings-tpl-title').textContent = t('tplTitle');
      document.getElementById('settings-tpl-sub').textContent = t('tplSub');
      document.getElementById('btn-tpl-reset').textContent = t('tplReset');
      document.getElementById('btn-tpl-save').textContent = t('tplSave');
      renderSettingsProfessors();
      renderTemplateEditor();
    }

    function renderSettingsProfessors() {
      const box = document.getElementById('settings-prof-list');
      if (!box) return;
      if (PROFESSORS.length === 0) {
        box.innerHTML = `<div class="brand-sub">${escapeHtml(t('noProfessorsYet'))}</div>`;
        return;
      }
      box.innerHTML = PROFESSORS.map(p => `
        <div class="prof-card">
          <div>
            <div style="font-weight:600;font-size:14px">${escapeHtml(p.name)}</div>
            <div class="brand-sub">${escapeHtml(p.roleTitleSr)} <span class="mono">${escapeHtml(p.email)}</span></div>
          </div>
          <button type="button" class="btn btn-sm btn-danger" onclick="adminDeleteProfessor('${p.id}')">✕</button>
        </div>`).join('');
    }

    async function adminCreateProfessor(e) {
      e.preventDefault();
      const name = document.getElementById('pr-name').value.trim();
      const title = document.getElementById('pr-title').value.trim();
      const email = document.getElementById('pr-email').value.trim();
      const pass = document.getElementById('pr-pass').value;
      if (!name || !email || !pass) return;
      const btn = document.getElementById('btn-pr-submit');
      btn.disabled = true;
      try {
        if (!secondaryApp) secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, 'secondary');
        const sAuth = secondaryApp.auth();
        const cred = await sAuth.createUserWithEmailAndPassword(email, pass);
        await secondaryApp.firestore().collection('users').doc(cred.user.uid).set({
          role: 'professor', name, title, email, createdAt: Date.now()
        });
        await sAuth.signOut();
        document.getElementById('prof-register-form').reset();
        showToast(t('profRegistered', name));
      } catch (err) {
        console.error(err);
        showToast(authErrMsg(err, 'prof'));
      } finally {
        btn.disabled = false;
      }
    }

    async function adminDeleteProfessor(id) {
      const p = PROFESSORS.find(x => x.id === id);
      if (!p || !confirm(t('profDeleteConfirm', p.name))) return;
      try { await db.collection('users').doc(id).delete(); }
      catch (err) { showToast(authErrMsg(err)); }
    }

    /* ---- template editor ---- */
    const TPL_PHASES = [['PRE', 'phasePre'], ['PROD', 'phaseProd'], ['POST', 'phasePost']];

    function renderTemplateEditor() {
      const box = document.getElementById('settings-template');
      if (!box) return;
      if (!adminTplDraft) adminTplDraft = JSON.parse(JSON.stringify(getTemplate()));
      box.innerHTML = TPL_PHASES.map(([k, labelKey]) => `
        <div class="panel">
          <div class="field-label">${escapeHtml(t(labelKey))}</div>
          ${(adminTplDraft[k] || []).map((c, ci) => `
            <div class="tpl-cat">
              <div class="tpl-row">
                <input type="color" value="${escapeHtml(c.color || '#6366f1')}" oninput="tplSetColor('${k}', ${ci}, this.value)" />
                <input class="input" value="${escapeHtml(c.name)}" oninput="tplSetCat('${k}', ${ci}, this.value)" />
                <button type="button" class="btn btn-sm btn-danger" onclick="tplDelCat('${k}', ${ci})">✕</button>
              </div>
              <div class="tpl-tasks">
                ${(c.tasks || []).map((n, ti) => `
                  <div class="tpl-row">
                    <input class="input" value="${escapeHtml(n)}" oninput="tplSetTask('${k}', ${ci}, ${ti}, this.value)" />
                    <button type="button" class="btn btn-sm" onclick="tplDelTask('${k}', ${ci}, ${ti})">✕</button>
                  </div>`).join('')}
                <button type="button" class="btn btn-sm" onclick="tplAddTask('${k}', ${ci})">${escapeHtml(t('tplAddTask'))}</button>
              </div>
            </div>`).join('')}
          <button type="button" class="btn btn-sm" onclick="tplAddCat('${k}')">${escapeHtml(t('tplAddCat'))}</button>
        </div>`).join('');
    }

    function tplSetColor(k, ci, v) { adminTplDraft[k][ci].color = v; }
    function tplSetCat(k, ci, v) { adminTplDraft[k][ci].name = v; }
    function tplSetTask(k, ci, ti, v) { adminTplDraft[k][ci].tasks[ti] = v; }
    function tplDelCat(k, ci) { adminTplDraft[k].splice(ci, 1); renderTemplateEditor(); }
    function tplDelTask(k, ci, ti) { adminTplDraft[k][ci].tasks.splice(ti, 1); renderTemplateEditor(); }
    function tplAddTask(k, ci) { adminTplDraft[k][ci].tasks.push(t('tplNewTask')); renderTemplateEditor(); }
    function tplAddCat(k) { adminTplDraft[k].push({ name: t('tplNewCat'), color: '#6366f1', tasks: [] }); renderTemplateEditor(); }
    function tplResetDefault() { adminTplDraft = defaultTemplate(); renderTemplateEditor(); }

    async function tplSave() {
      const clean = {};
      TPL_PHASES.forEach(([k]) => {
        clean[k] = (adminTplDraft[k] || [])
          .map(c => ({ name: String(c.name || '').trim(), color: c.color || '#6366f1', tasks: (c.tasks || []).map(x => String(x).trim()).filter(Boolean) }))
          .filter(c => c.name);
      });
      try {
        await db.collection('settings').doc('template').set({ phases: clean, updatedAt: Date.now() });
        showToast(t('tplSaved'));
      } catch (err) {
        showToast(authErrMsg(err));
      }
    }

    /* =========================================================================
       14. MASTER RENDER LOOP & INITIALIZATION
       ========================================================================= */
    function updateTopbar() {
      const topbar = document.getElementById('main-topbar');
      if (!appState.userType || !appState.currentUser) {
        topbar.classList.add('hidden');
        return;
      }

      topbar.classList.remove('hidden');
      const user = appState.currentUser;
      updateNotifBell();

      if (appState.userType === 'student') {
        document.getElementById('topbar-user-sub').textContent =
          `${user.name} · ${user.indexId} · ${t('yearShort', user.studyYear || 1)}`;
        document.getElementById('nav-workspace').classList.remove('hidden');
      } else {
        document.getElementById('topbar-user-sub').textContent =
          `${user.name} · ${currentLang === 'sr' ? user.roleTitleSr : user.roleTitleEn}`;
        document.getElementById('nav-workspace').classList.toggle('hidden', !appState.inspectStudentId);
      }

      document.getElementById('nav-projects').classList.toggle('active', appState.activeTab === 'projects');
      document.getElementById('nav-workspace').classList.toggle('active', appState.activeTab === 'workspace');

      const stu = getActiveStudent() || (appState.userType === 'student' ? user : null);
      const proj = getActiveProject(stu);
      const driveLabel = document.getElementById('drive-status-label');
      const drivePill = document.getElementById('drive-status-pill');

      if (proj && proj.driveFolderPath) {
        driveLabel.textContent = proj.driveFolderPath;
        drivePill.title = `${proj.driveFolderPath} (Anyone with the link)`;
      } else {
        driveLabel.textContent = 'Animation Pipeline (Anyone with the link)';
        drivePill.title = 'Animation Pipeline (Anyone with the link)';
      }
    }

    function renderAll() {
      applyStaticTranslations();

      const ids = ['auth-screen', 'gdrive-screen', 'projects-screen', 'workspace-screen', 'professor-screen', 'boot-screen', 'setup-screen', 'settings-screen'];
      const el = {};
      ids.forEach(id => { el[id] = document.getElementById(id); el[id].classList.add('hidden'); });
      const topbar = document.getElementById('main-topbar');

      if (!FIREBASE_READY) {
        topbar.classList.add('hidden');
        document.getElementById('setup-rules').textContent = FIRESTORE_RULES;
        el['setup-screen'].classList.remove('hidden');
        return;
      }
      if (appState.booting) {
        topbar.classList.add('hidden');
        el['boot-screen'].classList.remove('hidden');
        return;
      }

      if (!appState.userType || !appState.currentUser) {
        topbar.classList.add('hidden');
        if (appState.adminOpen) {
          el['settings-screen'].classList.remove('hidden');
          renderSettings();
        } else {
          el['auth-screen'].classList.remove('hidden');
        }
        return;
      }

      updateTopbar();

      if (appState.userType === 'student') {
        if (appState.driveOnboarding) {
          topbar.classList.add('hidden');
          el['gdrive-screen'].classList.remove('hidden');
          const stu = appState.currentUser;
          document.getElementById('gdrive-desc').textContent = t('gdriveDesc', stu.name, stu.indexId, stu.studyYear);
          document.getElementById('gdrive-email-input').value = stu.googleEmail || '';
          document.getElementById('gdrive-folder-preview').textContent = 'Drive / Animation Pipeline';
          return;
        }
        if (appState.activeTab === 'workspace') {
          el['workspace-screen'].classList.remove('hidden');
          renderWorkspace();
        } else {
          el['projects-screen'].classList.remove('hidden');
          renderProjectsScreen();
        }
      } else if (appState.userType === 'professor') {
        if (appState.activeTab === 'workspace' && appState.inspectStudentId) {
          el['workspace-screen'].classList.remove('hidden');
          renderWorkspace();
        } else {
          el['professor-screen'].classList.remove('hidden');
          renderProfessorDashboard();
        }
      }
    }

    (function initPortal() {
      injectStaticIcons();
      try {
        const savedLang = localStorage.getItem(LANG_KEY);
        if (savedLang === 'sr' || savedLang === 'en') currentLang = savedLang;
      } catch (err) {
        currentLang = 'sr';
      }
      if (!FIREBASE_READY) {
        renderAll();
        return;
      }
      appState.booting = true;
      renderAll();
      initBackend();
    })();
