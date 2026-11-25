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
      allow read: if true;                                           // TEMP: admin screen lists students
      allow create: if signedIn() && request.auth.uid == uid;
      allow update: if request.resource.data.role == resource.data.role;   // TEMP: admin screen edits students
      allow delete: if true;                                         // TEMP: admin screen
    }
    match /logins/{slug} {                                           // index number -> login email
      allow read: if true;
      allow write: if true;                                          // TEMP: admin screen
    }
    match /projects/{pid} {
      allow read: if true;                                           // TEMP: admin screen (professors only query public projects)
      allow create: if signedIn() && request.resource.data.studentId == request.auth.uid;
      allow update: if true;                                         // TEMP: admin screen moves projects on password reset
      allow delete: if true;                                         // TEMP: admin screen
    }
    match /notifs/{nid} {                                            // privacy notices for professors
      allow read, update: if isProf();
      allow create: if signedIn();
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
        approvedProgressLbl: 'Napredak',
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
        todoTitle: 'To do list',
        todoShowMore: (n) => `Prikaži dalje (${n})`, todoShowLess: 'Sakrij', todoNothingToday: 'Danas nema zakazanih zadataka.',
        addDocBtn: '+ Google Doc', docModalTitle: 'Dodaj Google Doc', docLinkLbl: 'Link', docNameLbl: 'Naziv (opciono)',
        docBadLink: 'Nalepi link ka Google Docs / Sheets / Slides dokumentu ili Drive fajlu.', docShareHint: 'Podeli dokument kao „Svako ko ima link”, da ga profesor može otvoriti.',
        docAddSubmit: 'Dodaj', docAdded: 'Dokument dodat.', docDelConfirm: 'Ukloniti ovaj dokument sa zadatka?',
        delComment: 'Obriši komentar', delCommentConfirm: 'Obrisati ovaj komentar?', delCommentRepliesConfirm: 'Obrisati komentar i odgovore na njega?',
        editProjectBtn: 'Izmeni projekat', saveProjBtn: 'Sačuvaj', projectUpdated: 'Projekat izmenjen.', badDates: 'Datum završetka mora biti posle datuma početka.',
        stNotifComment: 'Komentar profesora', stNotifApproved: 'Zadatak odobren', stNotifGrade: 'Nova ocena / komentar na projekat', stNotifOpen: 'Otvori', stNoNotifs: 'Nema novih obaveštenja.',
        delCatTitle: 'Obriši kategoriju', delTaskTitle: 'Obriši zadatak',
        delCatConfirm: (name, n) => `Obrisati kategoriju „${name}” i svih ${n} zadataka u njoj (sa komentarima i vezama ka fajlovima)? Fajlovi na Drive-u ostaju.`,
        delTaskConfirm: (name) => `Obrisati zadatak „${name}” (sa komentarima i vezama ka fajlovima)? Fajlovi na Drive-u ostaju.`,
        catDeleted: 'Kategorija obrisana.', taskDeleted: 'Zadatak obrisan.',
        todoOverdue: 'Kasni', todoToday: 'Danas', todoSoon: 'Narednih 7 dana', todoLater: 'Kasnije',
        todoEmpty: 'Nema zadataka koji čekaju rad.',
        todoNoDates: 'Projekat nema datum početka, pa se zadaci ne mogu rasporediti po kalendaru.',
        todayLbl: 'Danas',
        weekFilesTip: (n) => `${n} fajl(ova) dodato ove nedelje`,
        dayFilesTip: (n) => `${n} fajl(ova) dodato ovog dana`,
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
        mediaSectionLbl: 'Fajlovi',
        uploadMediaBtn: '+ Dodaj fajl',
        mediaUploaded: 'Fajl je dodat u folder na Drive-u.',
        noMedia: 'Nema.',
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
        approvedProgressLbl: 'Progress',
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
        todoTitle: 'To do list',
        todoShowMore: (n) => `Show more (${n})`, todoShowLess: 'Hide', todoNothingToday: 'Nothing scheduled for today.',
        addDocBtn: '+ Google Doc', docModalTitle: 'Add Google Doc', docLinkLbl: 'Link', docNameLbl: 'Name (optional)',
        docBadLink: 'Paste a link to a Google Docs / Sheets / Slides document or a Drive file.', docShareHint: 'Share the document as “Anyone with the link” so the professor can open it.',
        docAddSubmit: 'Add', docAdded: 'Document added.', docDelConfirm: 'Remove this document from the task?',
        delComment: 'Delete comment', delCommentConfirm: 'Delete this comment?', delCommentRepliesConfirm: 'Delete this comment and the replies to it?',
        editProjectBtn: 'Edit project', saveProjBtn: 'Save', projectUpdated: 'Project updated.', badDates: 'The end date must be after the start date.',
        stNotifComment: 'Professor comment', stNotifApproved: 'Task approved', stNotifGrade: 'New grade / project note', stNotifOpen: 'Open', stNoNotifs: 'No new notifications.',
        delCatTitle: 'Delete category', delTaskTitle: 'Delete task',
        delCatConfirm: (name, n) => `Delete category “${name}” and all ${n} tasks in it (with comments and file links)? Files on Drive stay.`,
        delTaskConfirm: (name) => `Delete task “${name}” (with comments and file links)? Files on Drive stay.`,
        catDeleted: 'Category deleted.', taskDeleted: 'Task deleted.',
        todoOverdue: 'Overdue', todoToday: 'Today', todoSoon: 'Next 7 days', todoLater: 'Later',
        todoEmpty: 'Nothing waiting to be worked on.',
        todoNoDates: 'The project has no start date, so tasks cannot be placed on the calendar.',
        todayLbl: 'Today',
        weekFilesTip: (n) => `${n} file(s) added this week`,
        dayFilesTip: (n) => `${n} file(s) added this day`,
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
        mediaSectionLbl: 'Files',
        uploadMediaBtn: '+ Add file',
        mediaUploaded: 'File added to project folder on Drive.',
        noMedia: 'None.',
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

    // ---- v7 additions (admin students, privacy, archive, notifications, file versions)
    Object.assign(I18N.sr, {
      projectNowPrivateToast: 'Student je projekat postavio kao privatan — više nije vidljiv profesorima.',
      archivedByProfToast: 'Ovaj projekat je arhivirao profesor — ne možete ga vratiti iz arhive.',
      archivedByProfLbl: 'Arhivirao profesor', archivedByStudentLbl: 'Arhivirao student',
      goPrivateConfirm: 'Projekat postaje privatan: samo vi ćete ga videti, profesori NE. Profesori dobijaju obaveštenje da je projekat postao privatan. Nastaviti?',
      nowPublicToast: 'Projekat je javan — profesori ga vide i dobili su obaveštenje.',
      nowPrivateToast: 'Projekat je privatan — vidite ga samo vi. Profesori su obavešteni.',
      visNotifPrivate: 'postavio je projekat kao privatan — profesori ga više ne vide',
      visNotifPublic: 'postavio je projekat kao javan',
      markReadBtn: 'Pročitano', markAllRead: 'Označi sve kao pročitano', noPublicProjects: 'Nema javnih projekata.',
      inboxAll: 'Sve', inboxFQuestions: 'Pitanja', inboxFApprovals: 'Odobrenja', inboxFPrivacy: 'Privatnost',
      archivedSection: (n) => `Arhivirano (${n})`, studentsCount: (n) => `${n} stud.`,
      newVersionBtn: '↻ Nova verzija', versionsLbl: (n) => `${n} verzije`, versionsHint: 'Prikaži sve verzije',
      deleteAllVersionsConfirm: (n) => `Obrisati fajl i svih ${n} verzija?`, versionUploaded: (n) => `Otpremljena verzija v${n}.`,
      settingsStuTitle: 'Studenti', settingsStuSub: 'Pregled svih studenata po godinama: izmena podataka, nova lozinka i brisanje profila.',
      stuSearchPh: 'Pretraga po imenu ili indeksu…', noStudentsAdmin: 'Nema studenata.',
      stuEditBtn: 'Izmeni', stuPassBtn: 'Nova lozinka', stuDeleteBtn: 'Obriši', stuEditTitle: 'Izmena studenta', stuSaveBtn: 'Sačuvaj',
      stuNewPassPrompt: (n) => `Nova lozinka za ${n} (min. 6 karaktera):`,
      stuPassDone: (n) => `Lozinka je promenjena za ${n}. Student se prijavljuje novom lozinkom.`,
      stuSaved: 'Student je izmenjen.',
      stuDeleteConfirm: (n, p) => `Obrisati studenta ${n} i svih ${p} njegovih projekata? Ovo se ne može poništiti. (Fajlovi na studentovom Google Drive-u ostaju.)`,
      stuDeleted: 'Student je obrisan.', projDeleteConfirm: (n) => `Obrisati projekat „${n}”?`, noProjectsYet: 'Nema projekata.'
    });
    Object.assign(I18N.en, {
      projectNowPrivateToast: 'The student made this project private — it is no longer visible to professors.',
      archivedByProfToast: 'This project was archived by a professor — you cannot restore it.',
      archivedByProfLbl: 'Archived by professor', archivedByStudentLbl: 'Archived by student',
      goPrivateConfirm: 'The project becomes private: only you can see it, professors cannot. Professors get a notification that it became private. Continue?',
      nowPublicToast: 'Project is public — professors can see it and were notified.',
      nowPrivateToast: 'Project is private — only you can see it. Professors were notified.',
      visNotifPrivate: 'made the project private — professors can no longer see it',
      visNotifPublic: 'made the project public',
      markReadBtn: 'Mark read', markAllRead: 'Mark all as read', noPublicProjects: 'No public projects.',
      inboxAll: 'All', inboxFQuestions: 'Questions', inboxFApprovals: 'Approvals', inboxFPrivacy: 'Privacy',
      archivedSection: (n) => `Archived (${n})`, studentsCount: (n) => `${n} students`,
      newVersionBtn: '↻ New version', versionsLbl: (n) => `${n} versions`, versionsHint: 'Show all versions',
      deleteAllVersionsConfirm: (n) => `Delete the file and all ${n} versions?`, versionUploaded: (n) => `Version v${n} uploaded.`,
      settingsStuTitle: 'Students', settingsStuSub: 'All students by study year: edit details, set a new password or delete a profile.',
      stuSearchPh: 'Search by name or index…', noStudentsAdmin: 'No students.',
      stuEditBtn: 'Edit', stuPassBtn: 'New password', stuDeleteBtn: 'Delete', stuEditTitle: 'Edit student', stuSaveBtn: 'Save',
      stuNewPassPrompt: (n) => `New password for ${n} (min. 6 characters):`,
      stuPassDone: (n) => `Password changed for ${n}. The student signs in with the new password.`,
      stuSaved: 'Student updated.',
      stuDeleteConfirm: (n, p) => `Delete student ${n} and all ${p} of their projects? This cannot be undone. (Files on the student's Google Drive stay.)`,
      stuDeleted: 'Student deleted.', projDeleteConfirm: (n) => `Delete project "${n}"?`, noProjectsYet: 'No projects.'
    });
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
      justRegistered: false,
      inboxFilter: 'all',    // 'all' | 'questions' | 'approvals' | 'privacy'
      todoMore: false,
      todayScrolledFor: ''
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
    let visNotifs = [];        // privacy notices (notifs collection) — professors only
    let adminStudents = [], adminProjects = [], adminUnsubs = [], adminStuQuery = '', adminBackfilled = false;

    function indexSlug(idx) {
      return String(idx).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'student';
    }

    // legacy accounts (created before password resets existed) log in with this email
    function indexToEmail(idx) { return `${indexSlug(idx)}@students.animpipe.app`; }

    // new accounts get a unique email so a deleted / reset index can always be registered again
    function newStudentEmail(idx) {
      return `${indexSlug(idx)}.${Math.random().toString(36).slice(2, 8)}@students.animpipe.app`;
    }

    async function resolveLoginEmail(idx) {
      try {
        const snap = await db.collection('logins').doc(indexSlug(idx)).get();
        if (snap.exists && snap.data().email) return snap.data().email;
      } catch (e) { console.warn('logins lookup', e); }
      return indexToEmail(idx);
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
      visNotifs = [];

      if (profile.role === 'professor') {
        appState.userType = 'professor';
        appState.currentUser = { id: uid, name: profile.name, email: profile.email, roleTitleSr: profile.title || '', roleTitleEn: profile.title || '' };
        unsubs.push(db.collection('users').where('role', '==', 'student').onSnapshot(snap => {
          studentProfiles = {};
          snap.docs.forEach(d => { studentProfiles[d.id] = { id: d.id, ...d.data() }; });
          onDataChanged();
        }, err => console.error('students listener', err)));
        // private projects are never downloaded by professors
        unsubs.push(db.collection('projects').where('isPublic', '==', true).onSnapshot(snap => {
          projectsById = {};
          snap.docs.forEach(d => { projectsById[d.id] = { ...d.data(), id: d.id }; });
          onDataChanged();
        }, err => console.error('projects listener', err)));
        unsubs.push(db.collection('notifs').orderBy('ts', 'desc').limit(200).onSnapshot(snap => {
          visNotifs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
          onDataChanged();
        }, err => console.error('notifs listener', err)));
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
      // a student made the project private while the professor was inside it
      if (appState.userType === 'professor' && appState.inspectStudentId && appState.activeProjectId) {
        const st = studentsData.find(s => s.id === appState.inspectStudentId);
        if (!st || !(st.projects || []).some(p => p.id === appState.activeProjectId)) {
          appState.inspectStudentId = null;
          appState.activeProjectId = null;
          appState.activeTab = 'projects';
          activeTaskModalIds = null;
          document.getElementById('task-detail-modal').classList.add('hidden');
          showToast(t('projectNowPrivateToast'));
        }
      }
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
        const dead = new Set([...(tk.deletedCommentIds || []), ...(r.deletedCommentIds || [])]);
        if (dead.size) { tk.deletedCommentIds = Array.from(dead).slice(-300); tk.comments = tk.comments.filter(cm => !dead.has(cm.id)); }
        const have = {};
        tk.comments.forEach(cm => { if (cm.id) have[cm.id] = cm; });
        (r.comments || []).forEach(rc => {
          if (!rc.id || dead.has(rc.id)) return;
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
      if (!Array.isArray(proj.categories)) {
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
        const slug = indexSlug(indexId);
        const existing = await db.collection('logins').doc(slug).get();
        if (existing.exists) throw { code: 'auth/email-already-in-use' };
        const loginEmail = newStudentEmail(indexId);
        const cred = await auth.createUserWithEmailAndPassword(loginEmail, password);
        const profile = {
          role: 'student', firstName, lastName, name: `${firstName} ${lastName}`, indexId, studyYear,
          authEmail: loginEmail, googleEmail: '', driveRootFolderId: '', createdAt: Date.now()
        };
        await db.collection('users').doc(cred.user.uid).set(profile);
        await db.collection('logins').doc(slug).set({ email: loginEmail, uid: cred.user.uid, indexId });
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
        const loginEmail = await resolveLoginEmail(indexId);
        const cred = await auth.signInWithEmailAndPassword(loginEmail, password);
        document.getElementById('login-pass').value = '';
        // make sure the index -> email mapping exists (older accounts)
        db.collection('logins').doc(indexSlug(indexId)).get().then(s => {
          if (!s.exists) return db.collection('logins').doc(indexSlug(indexId)).set({ email: loginEmail, uid: cred.user.uid, indexId });
        }).catch(() => {});
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
      document.getElementById('np-modal-sub').textContent = '';
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
          step('Drive…');
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
          sub.textContent = '';
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
      const archivedCount = allProjects.filter(p => isArchivedFor(p, 'student')).length;
      const list = allProjects.filter(p => !isArchivedFor(p, 'student') || appState.showArchived);

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
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;${isArchivedFor(proj, 'student') ? 'opacity:.6' : ''}">
            <div>
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600">${escapeHtml(proj.name)}${isArchivedFor(proj, 'student') ? ` <span class="badge">${escapeHtml(proj.archivedByProf ? t('archivedByProfLbl') : t('archivedLbl'))}</span>` : ''}</h3>
                  <div class="brand-sub mono" style="margin-top:3px">${escapeHtml(proj.animationType)} · ${escapeHtml(proj.length)}</div>
                </div>
                <span class="badge ${proj.isPublic ? 'badge-public' : 'badge-private'}">
                  ${proj.isPublic ? t('publicLbl') : t('privateLbl')}
                </span>
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


    /* ---- calendar mapping: column 0 = Monday of the week that contains the project's start date ---- */
    function projectAnchorDate(proj) {
      const s0 = new Date(String(proj && proj.startDate || '') + 'T00:00:00');
      if (isNaN(s0.getTime())) return null;
      return new Date(s0.getFullYear(), s0.getMonth(), s0.getDate() - ((s0.getDay() + 6) % 7));
    }

    function colToDate(proj, col) {
      const a = projectAnchorDate(proj);
      return a ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + col) : null;
    }

    function dateToColIndex(proj, date) {
      const a = projectAnchorDate(proj);
      if (!a) return null;
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return Math.round((d - a) / 86400000);
    }

    function fmtCol(proj, col) {
      const dt = colToDate(proj, col);
      return `${t('dayNames')[((col % 7) + 7) % 7]} ${dt.getDate()}.${dt.getMonth() + 1}.`;
    }

    // how many files (every version counts) were uploaded on each schedule column
    function collectUploadCols(proj) {
      const out = {};
      const total = (proj.totalWeeks || 4) * 7;
      (proj.categories || []).forEach(cat => (cat.tasks || []).forEach(tk => (tk.media || []).forEach(m => {
        mediaVersions(m).forEach(v => {
          const ts = v.uploadedAt || m.uploadedAt;
          if (!ts) return;
          const c = dateToColIndex(proj, new Date(ts));
          if (c === null || c < 0 || c >= total) return;
          out[c] = (out[c] || 0) + 1;
        });
      })));
      return out;
    }

    function positionTodayLine() {
      const line = document.getElementById('today-line');
      const table = document.getElementById('timeline-table');
      if (!line || !table) return;
      const th = table.querySelector('th.day-th.today');
      if (!th) { line.classList.add('hidden'); return; }
      const wrap = table.parentElement;
      const wr = wrap.getBoundingClientRect(), tr = th.getBoundingClientRect();
      if (!tr.width) { line.classList.add('hidden'); return; }
      line.style.left = (tr.left - wr.left + wrap.scrollLeft + tr.width / 2 - 1) + 'px';
      line.style.top = (tr.top - wr.top + wrap.scrollTop) + 'px';
      line.style.height = Math.max(0, table.offsetHeight - (tr.top - table.getBoundingClientRect().top)) + 'px';
      line.title = t('todayLbl');
      line.classList.remove('hidden');
    }

    function scrollTimelineToToday(proj) {
      if (appState.todayScrolledFor === proj.id) return;
      const table = document.getElementById('timeline-table');
      const th = table && table.querySelector('th.day-th.today');
      if (!th) return;
      appState.todayScrolledFor = proj.id;
      const wrap = table.parentElement;
      wrap.scrollLeft = Math.max(0, th.offsetLeft - 290 - 120);
      positionTodayLine();
    }

    function collectTodoRuns(proj) {
      const runs = [];
      (proj.categories || []).forEach(cat => (cat.tasks || []).forEach(task => {
        const cols = (task.scheduledDays || []).map(dayKeyToColIndex).filter(c => c >= 0).sort((a, b) => a - b);
        let i = 0;
        while (i < cols.length) {
          let j = i;
          while (j + 1 < cols.length && cols[j + 1] === cols[j] + 1) j++;
          runs.push({ cat, task, from: cols[i], to: cols[j] });
          i = j + 1;
        }
      }));
      return runs;
    }

    function toggleTodoMore() { appState.todoMore = !appState.todoMore; const st = getActiveStudent(); const pr = getActiveProject(st); if (pr) renderTodo(pr); }

    function renderTodo(proj) {
      const body = document.getElementById('ws-todo-body');
      const title = document.getElementById('ws-todo-title');
      if (!body || !title) return;
      const tc = dateToColIndex(proj, new Date());
      if (tc === null) { title.textContent = t('todoTitle'); body.innerHTML = `<div class="brand-sub">${escapeHtml(t('todoNoDates'))}</div>`; return; }

      const groups = [
        { key: 'todoOverdue', cls: 'overdue', items: [] },
        { key: 'todoToday', cls: 'today', items: [] },
        { key: 'todoSoon', cls: 'soon', items: [] },
        { key: 'todoLater', cls: 'later', items: [] }
      ];
      collectTodoRuns(proj).forEach(r => {
        const st = r.task.status;
        if (st === 'Approved') return;
        if (r.to < tc) { if (st !== 'Ready for Review') groups[0].items.push(r); }
        else if (r.from <= tc) groups[1].items.push(r);
        else if (r.from <= tc + 7) groups[2].items.push(r);
        else groups[3].items.push(r);
      });
      groups.forEach(g => g.items.sort((a, b) => a.from - b.from));

      const nToday = groups[1].items.length, nOver = groups[0].items.length;
      const nMore = groups[0].items.length + groups[2].items.length + groups[3].items.length;
      title.innerHTML = `${escapeHtml(t('todoTitle'))} ${nToday ? `<span class="badge mono" style="font-size:10px;padding:1px 6px">${nToday}</span>` : ''}${nOver ? ` <span class="badge badge-private mono" style="font-size:10px;padding:1px 6px" title="${escapeHtml(t('todoOverdue'))}">${nOver}</span>` : ''}`;

      const rowHtml = r => {
        const when = r.from === r.to ? fmtCol(proj, r.from) : `${fmtCol(proj, r.from)} – ${fmtCol(proj, r.to)}`;
        const n = r.to - r.from + 1;
        return `<div class="todo-row" onclick="openTaskModal('${r.cat.id}', '${r.task.id}')">
          <span class="color-dot" style="background:${escapeHtml(r.cat.color || '#6366f1')}"></span>
          <span class="todo-name">${escapeHtml(getCategoryDisplayName(r.cat))} / <strong>${escapeHtml(getTaskDisplayName(r.task))}</strong></span>
          <span class="todo-date mono">${escapeHtml(when)} · ${escapeHtml(t('scheduledDaysCount', n))}</span>
        </div>`;
      };
      const groupHtml = g => `<div class="todo-group ${g.cls}"><div class="todo-group-title">${escapeHtml(t(g.key))} <span class="mono">${g.items.length}</span></div>${g.items.map(rowHtml).join('')}</div>`;

      let html = nToday ? `<div class="todo-group today">${groups[1].items.map(rowHtml).join('')}</div>` : `<div class="brand-sub">${escapeHtml(t('todoNothingToday'))}</div>`;
      if (nMore) {
        if (appState.todoMore) html += [groups[0], groups[2], groups[3]].filter(g => g.items.length).map(groupHtml).join('');
        html += `<div><button type="button" class="btn btn-sm" onclick="toggleTodoMore()">${escapeHtml(appState.todoMore ? t('todoShowLess') : t('todoShowMore', nMore))}</button></div>`;
      }
      body.innerHTML = html;
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
        `${stu.name} (${stu.indexId}) · ${t('yearShort', stu.studyYear || 1)} · ${proj.animationType} · ${proj.length}`;

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
      const lockedByProf = !isProf && Boolean(proj.archivedByProf);
      archBtn.disabled = lockedByProf;
      if (lockedByProf) archBtn.textContent = t('archivedByProfLbl');

      document.getElementById('ws-add-week-btn').classList.toggle('hidden', !editable);
      const editBtn = document.getElementById('ws-edit-project-btn');
      editBtn.classList.toggle('hidden', !editable);
      editBtn.textContent = t('editProjectBtn');
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
      document.getElementById('ws-progress-pct').textContent = `${stats.approvedPct}%`;
      document.getElementById('ws-progress-pct').title = `${stats.approved}/${stats.total}`;
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

      renderTodo(proj);
      renderTimelineTable(proj, editable);
      scrollTimelineToToday(proj);
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

      const todayCol = dateToColIndex(proj, new Date());
      const fileCols = collectUploadCols(proj);
      for (let w = 1; w <= totalWeeks; w++) {
        let wkFiles = 0;
        for (let d = 0; d < 7; d++) wkFiles += fileCols[(w - 1) * 7 + d] || 0;
        const wkTag = wkFiles ? ` <span class="wk-files" title="${escapeHtml(t('weekFilesTip', wkFiles))}">${ic('clip')} ${wkFiles}</span>` : '';
        weekThHtml += `<th class="week-th" colspan="7">${escapeHtml(t('weekLbl'))} ${w}${wkTag}</th>`;
        for (let d = 0; d < 7; d++) {
          const col = (w - 1) * 7 + d;
          const isWeekend = d >= 5;
          const dt = colToDate(proj, col);
          const tip = [dt ? `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}` : '', fileCols[col] ? t('dayFilesTip', fileCols[col]) : '', col === todayCol ? t('todayLbl') : ''].filter(Boolean).join(' · ');
          dayThHtml += `<th class="day-th ${isWeekend ? 'weekend' : ''} ${col === todayCol ? 'today' : ''} ${fileCols[col] ? 'has-files' : ''}" title="${escapeHtml(tip)}">${escapeHtml(shortDays[d])}</th>`;
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
                    ${editable ? `<button type="button" class="btn-icon" title="${escapeHtml(t('addTaskTitle'))}" onclick="openAddTaskModal('${cat.id}')">+</button>` : ''}
                    ${editable ? `<button type="button" class="btn-icon btn-del" title="${escapeHtml(t('delCatTitle'))}" onclick="deleteCategory('${cat.id}')">×</button>` : ''}
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
            const mediaCount = (task.media || []).length + (task.docs || []).length;
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
                      ${editable ? `<button type="button" class="btn-icon btn-del" title="${escapeHtml(t('delTaskTitle'))}" onclick="deleteTask('${cat.id}', '${task.id}')">×</button>` : ''}
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
                    <div class="bar-wrap">
                      <div class="merged-bar" style="background:${escapeHtml(cat.color || '#6366f1')}" title="${escapeHtml(taskName)} — ${escapeHtml(getStatusLabel(task.status))}" onclick="openTaskModal('${cat.id}', '${task.id}')">
                        <span class="merged-bar-title">${escapeHtml(taskName)}</span>
                        <span class="merged-bar-tag">${escapeHtml(pillText)}</span>
                      </div>
                      ${(mediaCount || commentCount) ? `<span class="bar-marks">${mediaCount ? `<span class="bar-mark file" title="${escapeHtml(String(mediaCount))}">${ic('clip')}</span>` : ''}${openQCount ? `<span class="bar-mark ask" title="${escapeHtml(String(openQCount))}">${ic('question')}</span>` : (commentCount ? `<span class="bar-mark chat" title="${escapeHtml(String(commentCount))}">${ic('chat')}</span>` : '')}</span>` : ''}
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
      positionTodayLine();
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
      // archived by either side = archived for both (a professor's archive also lands in the student's archive)
      return Boolean(proj.archivedByStudent || proj.archivedByProf);
    }

    function toggleArchiveProject() {
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;
      const isProfUser = appState.userType === 'professor';
      if (!isProfUser && proj.archivedByProf) { showToast(t('archivedByProfToast')); return; }
      const key = isProfUser ? 'archivedByProf' : 'archivedByStudent';
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

    function notifyVisibilityChange(stu, proj) {
      if (!db) return;
      db.collection('notifs').add({
        type: 'visibility', studentId: stu.id, studentName: stu.name || '', studentIndex: stu.indexId || '',
        studentYear: Number(stu.studyYear) || 1, projectId: proj.id, projectName: proj.name || '',
        isPublic: Boolean(proj.isPublic), ts: Date.now(), readBy: {}
      }).catch(err => console.warn('visibility notif', err));
    }

    function toggleProjectVisibility() {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      if (!proj) return;
      if (proj.isPublic && !window.confirm(t('goPrivateConfirm'))) return;
      proj.isPublic = !proj.isPublic;
      saveStudentsToStorage();
      notifyVisibilityChange(stu, proj);
      showToast(t(proj.isPublic ? 'nowPublicToast' : 'nowPrivateToast'));
      renderWorkspace();
    }

    /* =========================================================================
       11. ADD CATEGORY & ADD TASK MODALS
       ========================================================================= */
    function openEditProjectModal() {
      if (!canEditActiveProject()) return;
      const proj = getActiveProject(getActiveStudent());
      if (!proj) return;
      document.getElementById('ep-title').textContent = t('editProjectBtn');
      document.getElementById('lbl-ep-name').textContent = t('npName');
      document.getElementById('lbl-ep-type').textContent = t('npType');
      document.getElementById('lbl-ep-length').textContent = t('npLength');
      document.getElementById('lbl-ep-start').textContent = t('npStart');
      document.getElementById('lbl-ep-end').textContent = t('npEnd');
      document.getElementById('btn-ep-cancel').textContent = t('cancel');
      document.getElementById('btn-ep-submit').textContent = t('saveProjBtn');
      document.getElementById('ep-name').value = proj.name || '';
      document.getElementById('ep-type').value = proj.animationType || '3D CGI';
      document.getElementById('ep-length').value = proj.length || '';
      document.getElementById('ep-start').value = proj.startDate || '';
      document.getElementById('ep-end').value = proj.endDate || '';
      document.getElementById('edit-project-modal').classList.remove('hidden');
    }

    function handleEditProject(e) {
      e.preventDefault();
      if (!canEditActiveProject()) return;
      const proj = getActiveProject(getActiveStudent());
      if (!proj) return;
      const name = document.getElementById('ep-name').value.trim();
      const length = document.getElementById('ep-length').value.trim();
      const startDate = document.getElementById('ep-start').value;
      const endDate = document.getElementById('ep-end').value;
      if (!name || !length || !startDate || !endDate) return;
      if (new Date(endDate) <= new Date(startDate)) { showToast(t('badDates')); return; }

      const oldName = proj.name;
      proj.name = name;
      proj.animationType = document.getElementById('ep-type').value;
      proj.length = length;
      proj.startDate = startDate;
      proj.endDate = endDate;
      proj.driveFolderPath = `Animation Pipeline / ${name}`;
      let used = 0;   // never cut off a week that already has scheduled tasks
      (proj.categories || []).forEach(c => (c.tasks || []).forEach(tk => (tk.scheduledDays || []).forEach(dk => {
        const w = Number(String(dk).split('-')[0]); if (w > used) used = w;
      })));
      proj.totalWeeks = Math.max(calcWeeksFromDates(startDate, endDate), used);

      saveStudentsToStorage();
      closeModal('edit-project-modal');
      renderAll();
      showToast(t('projectUpdated'));

      if (name !== oldName && driveTokenValid()) {   // keep Drive names in step (only when a Drive session is already live)
        if (proj.driveFolderId) driveFetch(`${DRIVE_FILES}/${proj.driveFolderId}`, { method: 'PATCH', headers: JSON_HDR, body: JSON.stringify({ name }) }).catch(err => console.warn('drive rename', err));
        if (proj.driveSheetId) driveFetch(`${DRIVE_FILES}/${proj.driveSheetId}`, { method: 'PATCH', headers: JSON_HDR, body: JSON.stringify({ name: `${name}_Schedule` }) }).catch(err => console.warn('sheet rename', err));
      }
    }

    function deleteCategory(catId) {
      if (!canEditActiveProject()) return;
      const stu = getActiveStudent();
      const proj = getActiveProject(stu);
      const cat = proj ? proj.categories.find(c => c.id === catId) : null;
      if (!cat) return;
      if (!window.confirm(t('delCatConfirm', getCategoryDisplayName(cat), (cat.tasks || []).length))) return;
      proj.categories = proj.categories.filter(c => c.id !== catId);
      if (activeTaskModalIds && activeTaskModalIds.catId === catId) { activeTaskModalIds = null; closeModal('task-detail-modal'); }
      saveStudentsToStorage();
      renderWorkspace();
      showToast(t('catDeleted'));
    }

    function deleteTask(catId, taskId) {
      if (!canEditActiveProject()) return;
      const { proj, cat, task } = findTaskCtx(catId, taskId);
      if (!proj || !cat || !task) return;
      if (!window.confirm(t('delTaskConfirm', getTaskDisplayName(task)))) return;
      cat.tasks = cat.tasks.filter(x => x.id !== taskId);
      if (activeTaskModalIds && activeTaskModalIds.taskId === taskId) { activeTaskModalIds = null; closeModal('task-detail-modal'); }
      saveStudentsToStorage();
      renderWorkspace();
      showToast(t('taskDeleted'));
    }

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
    let taskDaysOpen = false; // task window: scheduled-days dropdown

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

    /* ---------- Google Docs / Sheets / Slides links on a task ---------- */
    const GOOGLE_DOC_RE = /^https:\/\/(docs|drive)\.google\.com\/(document|spreadsheets|presentation|forms|file)\/(?:u\/\d+\/)?d\/([\w-]+)/i;

    function parseGoogleDocLink(raw) {
      const u = String(raw || '').trim();
      const m = u.match(GOOGLE_DOC_RE);
      if (!m) return null;
      const kind = { document: 'Doc', spreadsheets: 'Sheet', presentation: 'Slides', forms: 'Form', file: 'Drive' }[m[2].toLowerCase()];
      return { url: u, kind };
    }

    function taskDocsHtml(cat, task, editable) {
      const docs = (task.docs || []).filter(d => d && GOOGLE_DOC_RE.test(String(d.url || '')));
      if (!docs.length) return '';
      return `<div class="doc-list">${docs.map(d => {
        const i = task.docs.indexOf(d);
        return `<div class="doc-row">
          <a class="doc-link" href="${escapeHtml(d.url)}" target="_blank" rel="noopener"><span class="badge mono">${escapeHtml(d.kind || 'Doc')}</span><span class="doc-name">${escapeHtml(d.name || 'Google Doc')}</span> ↗</a>
          ${editable ? `<button type="button" class="btn btn-sm btn-danger" style="padding:2px 6px" onclick="deleteTaskDoc('${cat.id}', '${task.id}', ${i})">✕</button>` : ''}
        </div>`;
      }).join('')}</div>`;
    }

    let activeDocCtx = null;
    function openAddDocModal(catId, taskId) {
      if (!canEditActiveProject()) return;
      activeDocCtx = { catId, taskId };
      document.getElementById('doc-modal-title').textContent = t('docModalTitle');
      document.getElementById('lbl-doc-link').textContent = t('docLinkLbl');
      document.getElementById('lbl-doc-name').textContent = t('docNameLbl');
      document.getElementById('doc-share-hint').textContent = t('docShareHint');
      document.getElementById('btn-doc-cancel').textContent = t('cancel');
      document.getElementById('btn-doc-submit').textContent = t('docAddSubmit');
      document.getElementById('doc-link').value = '';
      document.getElementById('doc-name').value = '';
      document.getElementById('add-doc-modal').classList.remove('hidden');
      document.getElementById('doc-link').focus();
    }

    function handleAddDoc(e) {
      e.preventDefault();
      if (!activeDocCtx || !canEditActiveProject()) return;
      const parsed = parseGoogleDocLink(document.getElementById('doc-link').value);
      if (!parsed) { showToast(t('docBadLink')); return; }
      const { task } = findTaskCtx(activeDocCtx.catId, activeDocCtx.taskId);
      if (!task) return;
      if (!Array.isArray(task.docs)) task.docs = [];
      task.docs.push({
        id: 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        name: document.getElementById('doc-name').value.trim() || ('Google ' + parsed.kind),
        url: parsed.url, kind: parsed.kind, addedAt: Date.now(),
        authorId: appState.currentUser ? appState.currentUser.id : ''
      });
      const { catId, taskId } = activeDocCtx;
      saveStudentsToStorage();
      closeModal('add-doc-modal');
      renderWorkspace();
      openTaskModal(catId, taskId);
      showToast(t('docAdded'));
    }

    function deleteTaskDoc(catId, taskId, idx) {
      if (!canEditActiveProject()) return;
      const { task } = findTaskCtx(catId, taskId);
      if (!task || !Array.isArray(task.docs) || !task.docs[idx]) return;
      if (!window.confirm(t('docDelConfirm'))) return;
      task.docs.splice(idx, 1);
      saveStudentsToStorage();
      renderWorkspace();
      openTaskModal(catId, taskId);
    }

    /* ---------- comments: "unsend" ---------- */
    function isMyComment(c) {
      const me = appState.currentUser;
      if (!me || !c || !c.id) return false;
      if (c.authorId) return c.authorId === me.id;
      return c.author === me.name && c.authorRole === appState.userType;
    }

    function deleteTaskComment(catId, taskId, commentId) {
      const { task } = findTaskCtx(catId, taskId);
      if (!task || !Array.isArray(task.comments)) return;
      const c = task.comments.find(x => x.id === commentId);
      if (!c || !isMyComment(c)) return;
      const replies = task.comments.filter(r => r.replyTo === commentId);
      if (!window.confirm(t(replies.length ? 'delCommentRepliesConfirm' : 'delCommentConfirm'))) return;
      const gone = new Set([commentId, ...replies.map(r => r.id)]);
      if (c.replyTo) {   // deleting my answer re-opens the question if nothing else answers it
        const parent = task.comments.find(x => x.id === c.replyTo);
        if (parent && !task.comments.some(r => r.replyTo === parent.id && !gone.has(r.id))) parent.answered = false;
      }
      task.comments = task.comments.filter(x => !gone.has(x.id));
      task.deletedCommentIds = Array.from(new Set([...(task.deletedCommentIds || []), ...gone])).slice(-300);
      saveStudentsToStorage();
      renderWorkspace();
      if (appState.userType === 'professor') renderProfessorDashboard();
      openTaskModal(catId, taskId);
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
            <div class="comment-head">
              <strong>${escapeHtml(c.author)}</strong>
              <span class="brand-sub mono" style="margin-left:auto">${escapeHtml(c.time)}</span>
              ${isMyComment(c) ? `<details class="dots"><summary title="${escapeHtml(t('delComment'))}">⋯</summary><div class="dots-menu"><button type="button" onclick="deleteTaskComment('${cat.id}', '${task.id}', '${c.id}')">${escapeHtml(t('delComment'))}</button></div></details>` : ''}
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

      if (!isProf && editable) {
        let seen = false;
        (task.comments || []).forEach(c => { if (c.authorRole === 'professor' && c.seenByStudent === false) { c.seenByStudent = true; seen = true; } });
        if (task.approvedNotif && !task.approvedNotif.seen) { task.approvedNotif.seen = true; seen = true; }
        if (seen) saveStudentsToStorage();
      }

      document.getElementById('td-meta').textContent =
        `${proj.name} · ${getCategoryDisplayName(cat)}`;
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

        <details class="panel fold" style="margin-bottom:14px" ${taskDaysOpen ? 'open' : ''} ontoggle="taskDaysOpen = this.open">
          <summary>
            <span class="field-label" style="margin:0">${escapeHtml(t('daysSectionLbl'))}</span>
            <span class="badge mono" style="font-size:10px;padding:1px 6px">${escapeHtml(t('scheduledDaysCount', (task.scheduledDays || []).filter(dk => dayKeyToColIndex(dk) >= 0).length))}</span>
          </summary>
          ${(editable && (task.scheduledDays || []).length) ? `<div style="margin:8px 0 0"><button type="button" class="btn btn-sm btn-danger" onclick="clearTaskDays('${cat.id}', '${task.id}')">${escapeHtml(t('daysClearAll'))}</button></div>` : ''}
          <div style="margin-top:8px">
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
        </details>

        <div class="panel" style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
            <div class="field-label" style="margin:0">${escapeHtml(t('mediaSectionLbl'))}</div>
            ${editable ? `
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <label class="btn btn-sm btn-primary" style="cursor:pointer">
                  ${escapeHtml(t('uploadMediaBtn'))}
                  <input type="file" accept="image/*,video/*" multiple style="display:none" onchange="onUploadTaskMedia(event, '${cat.id}', '${task.id}')" />
                </label>
                <button type="button" class="btn btn-sm" onclick="openAddDocModal('${cat.id}', '${task.id}')">${escapeHtml(t('addDocBtn'))}</button>
              </div>
            ` : ''}
          </div>

          ${taskDocsHtml(cat, task, editable)}

          ${(mediaList.length === 0 && !(task.docs || []).length)
            ? `<div class="brand-sub" style="margin-top:8px">${escapeHtml(t('noMedia'))}</div>`
            : ''}

          ${mediaList.length === 0 ? '' : `<div class="media-grid">
                ${mediaList.map((item, idx) => `
                  <div class="media-card">
                    <div class="media-thumb" title="${escapeHtml(t('mediaOpenHint'))}" onclick="openLightbox('${cat.id}', '${task.id}', ${idx})">
                      ${mediaCardInner(item)}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                      <span class="brand-sub mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(item.name)}</span>
                      ${editable ? `<button type="button" class="btn btn-sm btn-danger" style="padding:2px 6px" onclick="deleteTaskMedia('${cat.id}', '${task.id}', ${idx})">✕</button>` : ''}
                    </div>
                    ${mediaVersionRowHtml(cat.id, task.id, item, idx, editable)}
                  </div>
                `).join('')}
              </div>`}
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
      if (newStatus === 'Approved' && appState.userType === 'professor') task.approvedNotif = { ts: Date.now(), seen: false };
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

    // ---- every media item keeps ALL its versions; top-level fields always mirror the newest one
    function mediaSnapshot(item, ver) {
      return {
        ver, name: item.name || '', type: item.type || 'image', mimeType: item.mimeType || '',
        driveFileId: item.driveFileId || '', webViewLink: item.webViewLink || '', thumbnailLink: item.thumbnailLink || '',
        url: item.url || '', drivePath: item.drivePath || '', uploadedAt: item.uploadedAt || 0
      };
    }

    function mediaVersions(item) {
      if (Array.isArray(item.versions) && item.versions.length) return item.versions;
      return [mediaSnapshot(item, 1)];   // older files without history = v1
    }

    function mediaVersionRowHtml(catId, taskId, item, idx, editable) {
      const n = mediaVersions(item).length;
      return `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px">
        <button type="button" class="btn btn-sm" style="padding:2px 8px" title="${escapeHtml(t('versionsHint'))}" onclick="openLightbox('${catId}', '${taskId}', ${idx})">v${n}${n > 1 ? ' · ' + escapeHtml(t('versionsLbl', n)) : ''}</button>
        ${editable ? `<label class="btn btn-sm btn-primary" style="cursor:pointer;padding:2px 8px">${escapeHtml(t('newVersionBtn'))}
          <input type="file" accept="image/*,video/*" style="display:none" onchange="onUploadMediaVersion(event, '${catId}', '${taskId}', ${idx})" /></label>` : ''}
      </div>`;
    }

    function onUploadMediaVersion(event, catId, taskId, idx) {
      if (!canEditActiveProject()) return;
      const file = (event.target.files || [])[0];
      event.target.value = '';
      if (!file) return;
      let tokenP;
      try { tokenP = getDriveToken(); } catch (err) { showToast(err.message); return; }  // sync: keeps the user gesture
      const first = findTaskCtx(catId, taskId);
      if (!first.proj || !first.task || !first.task.media || !first.task.media[idx]) return;
      const targetId = first.task.media[idx].id;
      const folderId = first.task.driveFolderId || first.proj.assetsFolderId;
      if (!folderId) { showToast(t('noAssetsFolder')); return; }
      (async () => {
        try {
          await tokenP;
          showToast(t('uploading', 1));
          const meta = await driveUpload(file, folderId);
          const mime = meta.mimeType || file.type || '';
          const ctx = findTaskCtx(catId, taskId);   // re-resolve: a snapshot may have replaced the objects
          const item = ctx.task && (ctx.task.media || []).find(m => m.id === targetId);
          if (!item) return;
          const versions = mediaVersions(item).slice();
          const ver = versions.length + 1;
          const entry = {
            ver, name: meta.name, type: mime.indexOf('video/') === 0 ? 'video' : 'image', mimeType: mime,
            driveFileId: meta.id, webViewLink: meta.webViewLink || '', thumbnailLink: meta.thumbnailLink || '', url: '',
            drivePath: `${ctx.proj.driveFolderPath}/Assets & Media/${meta.name}`, uploadedAt: Date.now()
          };
          versions.push(entry);
          const { ver: _v, ...fields } = entry;
          Object.assign(item, fields, { versions, currentVer: ver });
          saveStudentsToStorage();
          renderWorkspace();
          openTaskModal(catId, taskId);
          showToast(t('versionUploaded', ver));
        } catch (err) {
          console.error(err);
          showToast(t('driveErr') + ' ' + err.message);
        }
      })();
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
            const lastItem = uploaded[uploaded.length - 1];
            lastItem.versions = [mediaSnapshot(lastItem, 1)];
            lastItem.currentVer = 1;
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
      const allVersions = item ? mediaVersions(item) : [];
      if (allVersions.length > 1 && !window.confirm(t('deleteAllVersionsConfirm', allVersions.length))) return;
      task.media.splice(idx, 1);
      saveStudentsToStorage();
      renderWorkspace();
      openTaskModal(catId, taskId);
      if (driveTokenValid()) {
        allVersions.forEach(v => {
          if (v.driveFileId) driveFetch(`${DRIVE_FILES}/${v.driveFileId}`, { method: 'DELETE' }).catch(err => console.warn('drive delete', err));
        });
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
        replyTo: (isProf && replyTargetId) ? replyTargetId : null,
        seenByStudent: !isProf
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
      lightboxState = { catId, taskId, idx, ver: null };
      renderLightbox();
      document.getElementById('lightbox').classList.remove('hidden');
    }

    function lightboxVersion(i) {
      if (!lightboxState) return;
      lightboxState.ver = i;
      renderLightbox();
    }

    function renderLightbox() {
      if (!lightboxState) return;
      const { task } = findTaskCtx(lightboxState.catId, lightboxState.taskId);
      const list = task ? (task.media || []) : [];
      const item = list[lightboxState.idx];
      if (!item) { closeLightbox(); return; }
      const versions = mediaVersions(item);
      let vi = lightboxState.ver;
      if (vi === null || vi === undefined || vi < 0 || vi >= versions.length) vi = versions.length - 1;
      const view = versions[vi];
      const stage = document.getElementById('lb-stage');
      if (view.type === 'video') {
        stage.innerHTML = view.driveFileId
          ? `<iframe src="https://drive.google.com/file/d/${encodeURIComponent(view.driveFileId)}/preview" allow="autoplay; fullscreen" allowfullscreen></iframe>`
          : `<video src="${escapeHtml(view.url)}" controls autoplay playsinline></video>`;
      } else {
        stage.innerHTML = `<img src="${escapeHtml(mediaThumbUrl(view, 2400))}" alt="${escapeHtml(view.name)}" />`;
      }
      const driveUrl = mediaDriveUrl(view);
      document.getElementById('lb-open-drive').innerHTML = driveUrl
        ? `<a href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener" style="color:inherit">${escapeHtml(t('openOnDrive'))} ↗</a>` : '';
      const when = view.uploadedAt ? new Date(view.uploadedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
      const chips = versions.length > 1
        ? `<div style="margin-top:6px">${versions.map((v, i) => `<button type="button" class="lb-ver ${i === vi ? 'active' : ''}" onclick="event.stopPropagation();lightboxVersion(${i})">v${i + 1}</button>`).join('')}</div>`
        : '';
      document.getElementById('lb-caption').innerHTML =
        `${escapeHtml(view.name)}  ·  v${vi + 1}/${versions.length}${when ? '  ·  ' + escapeHtml(when) : ''}  ·  ${lightboxState.idx + 1} / ${list.length}${chips}`;
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
      lightboxState.ver = null;
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

    function yearOfStudent(stu) { return Number(stu && stu.studyYear) || 1; }

    // privacy notices: latest unread one per project
    function collectVisNotifs(profId, studentList) {
      const allowed = new Set((studentList || studentsData).map(s => s.id));
      const latest = {};
      visNotifs.forEach(n => {           // newest first
        if (n.type !== 'visibility' || !allowed.has(n.studentId) || latest[n.projectId]) return;
        latest[n.projectId] = n;
      });
      return Object.values(latest).filter(n => !(n.readBy && n.readBy[profId]));
    }

    function markVisNotifRead(projectId) {
      const me = appState.currentUser && appState.currentUser.id;
      if (!me) return;
      visNotifs.filter(n => n.projectId === projectId && !(n.readBy && n.readBy[me])).forEach(n => {
        n.readBy = { ...(n.readBy || {}), [me]: true };
        db.collection('notifs').doc(n.id).update({ ['readBy.' + me]: true }).catch(err => console.warn('notif read', err));
      });
      refreshInboxViews();
    }

    function markAllVisRead() {
      const me = appState.currentUser && appState.currentUser.id;
      if (!me) return;
      collectVisNotifs(me).forEach(n => markVisNotifRead(n.projectId));
    }

    function setInboxFilter(f) {
      appState.inboxFilter = f;
      refreshInboxViews();
    }

    function refreshInboxViews() {
      const dash = document.getElementById('professor-screen');
      if (dash && !dash.classList.contains('hidden')) renderProfessorDashboard(); else updateNotifBell();
    }

    function openNotifProject(studentId, projectId) {
      const stu = studentsData.find(s => s.id === studentId);
      if (!stu || !(stu.projects || []).some(p => p.id === projectId)) return;
      document.getElementById('notif-panel').classList.add('hidden');
      inspectStudentProject(studentId, projectId);
    }

    function visRowHtml(n) {
      const d = new Date(n.ts || Date.now());
      const when = d.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="inbox-row vis-silent">
          <div><span class="badge ${n.isPublic ? 'badge-public' : 'badge-private'}">${escapeHtml(t(n.isPublic ? 'publicLbl' : 'privateLbl'))}</span>
            <strong>${escapeHtml(n.studentName)}</strong> — ${escapeHtml(n.projectName)}
            <div class="brand-sub" style="margin-top:2px">${escapeHtml(t(n.isPublic ? 'visNotifPublic' : 'visNotifPrivate'))} · ${escapeHtml(when)}</div></div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            ${n.isPublic ? `<button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();openNotifProject('${n.studentId}', '${n.projectId}')">${escapeHtml(t('openTaskBtn'))}</button>` : ''}
            <button type="button" class="btn btn-sm" onclick="event.stopPropagation();markVisNotifRead('${n.projectId}')">${escapeHtml(t('markReadBtn'))}</button>
          </div>
        </div>`;
    }

    function inboxGroupsHtml(groups, scope, filter) {
      const f = filter || 'all';
      const showA = f === 'all' || f === 'approvals';
      const showQ = f === 'all' || f === 'questions';
      return groups.map(g => {
        const approvals = showA ? g.approvals : [];
        const questions = showQ ? g.questions : [];
        if (!approvals.length && !questions.length) return '';
        const key = scope + ':' + g.proj.id;
        const badges = [
          approvals.length ? `<span class="badge badge-review">${ic('hourglass')} ${escapeHtml(t('inboxApprovals', approvals.length))}</span>` : '',
          questions.length ? `<span class="q-badge">${ic('question')} ${escapeHtml(t('inboxQuestions', questions.length))}</span>` : ''
        ].join(' ');
        const open = (stuId, projId, catId, tkId) => `openQuestionTask('${stuId}', '${projId}', '${catId}', '${tkId}')`;
        const rows = [
          ...approvals.map(a => `
            <div class="inbox-row">
              <div>${ic('hourglass')} ${escapeHtml(getCategoryDisplayName(a.cat))} / <strong>${escapeHtml(getTaskDisplayName(a.tk))}</strong></div>
              <button type="button" class="btn btn-primary btn-sm" onclick="${open(g.stu.id, g.proj.id, a.cat.id, a.tk.id)}">${escapeHtml(t('openTaskBtn'))}</button>
            </div>`),
          ...questions.map(q => {
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
              <span>${g.unread && showQ ? '<span class="new-dot"></span>' : ''}<strong>${escapeHtml(g.stu.name)}</strong>
                <span class="brand-sub mono">(${escapeHtml(g.stu.indexId)})</span>
                — ${escapeHtml(g.proj.name)}</span>
              <span>${badges}</span>
            </summary>
            <div class="inbox-items">${rows}</div>
          </details>`;
      }).join('');
    }

    // whole notification area: type filter chips -> year sections -> project groups / privacy notices
    function inboxHtml(groups, vis, scope) {
      const f = appState.inboxFilter || 'all';
      const counts = {
        questions: groups.reduce((n, g) => n + g.questions.length, 0),
        approvals: groups.reduce((n, g) => n + g.approvals.length, 0),
        privacy: vis.length
      };
      const total = counts.questions + counts.approvals;
      const chip = (key, label, n) => `<button type="button" class="chip ${f === key ? 'active' : ''}" onclick="event.stopPropagation();setInboxFilter('${key}')">${escapeHtml(label)} <span class="mono">${n}</span></button>`;
      const filters = `<div class="inbox-filters">${chip('all', t('inboxAll'), total)}${chip('questions', t('inboxFQuestions'), counts.questions)}${chip('approvals', t('inboxFApprovals'), counts.approvals)}${chip('privacy', t('inboxFPrivacy'), counts.privacy)}</div>`;

      const byYear = {};
      const slot = y => (byYear[y] = byYear[y] || { groups: [], vis: [] });
      groups.forEach(g => slot(yearOfStudent(g.stu)).groups.push(g));
      vis.forEach(n => { const p = studentProfiles[n.studentId]; slot(Number(p ? p.studyYear : n.studentYear) || 1).vis.push(n); });
      const showVis = f === 'all' || f === 'privacy';

      let body = Object.keys(byYear).map(Number).sort((x, y) => x - y).map(y => {
        const gHtml = inboxGroupsHtml(byYear[y].groups, scope, f);
        const vHtml = showVis ? byYear[y].vis.map(visRowHtml).join('') : '';
        if (!gHtml && !vHtml) return '';
        return `<div class="inbox-year"><div class="inbox-year-title">${escapeHtml(t('yearShort', y))}</div>${gHtml}${vHtml ? `<div class="inbox-items" style="padding:0 0 6px">${vHtml}</div>` : ''}</div>`;
      }).join('');
      if (!body) body = `<div class="brand-sub">${escapeHtml(t('noNotifs'))}</div>`;
      const markAll = (showVis && vis.length > 1)
        ? `<div style="margin-top:6px"><button type="button" class="btn btn-sm" onclick="event.stopPropagation();markAllVisRead()">${escapeHtml(t('markAllRead'))}</button></div>` : '';
      return filters + body + markAll;
    }

    function collectStudentNotifs() {
      const me = appState.currentUser;
      if (!me || appState.userType !== 'student') return [];
      const out = [];
      (me.projects || []).forEach(proj => {
        (proj.categories || []).forEach(cat => (cat.tasks || []).forEach(task => {
          const fresh = (task.comments || []).filter(c => c.authorRole === 'professor' && c.seenByStudent === false);
          if (fresh.length) {
            const last = fresh[fresh.length - 1];
            out.push({ kind: 'comment', proj, cat, task, n: fresh.length, text: last.text || '', ts: last.ts || 0 });
          }
          if (task.approvedNotif && !task.approvedNotif.seen) out.push({ kind: 'approved', proj, cat, task, ts: task.approvedNotif.ts || 0 });
        }));
        if (proj.gradeNotif && !proj.gradeNotif.seen) out.push({ kind: 'grade', proj, ts: proj.gradeNotif.ts || 0 });
      });
      return out.sort((a, b) => b.ts - a.ts);
    }

    function studentInboxHtml(items) {
      if (!items.length) return `<div class="brand-sub">${escapeHtml(t('stNoNotifs'))}</div>`;
      return items.map(it => {
        const label = it.kind === 'comment' ? t('stNotifComment') : it.kind === 'approved' ? t('stNotifApproved') : t('stNotifGrade');
        const icon = it.kind === 'comment' ? ic('chat') : it.kind === 'approved' ? '✓' : ic('hourglass');
        const where = it.task ? `${escapeHtml(getCategoryDisplayName(it.cat))} / <strong>${escapeHtml(getTaskDisplayName(it.task))}</strong>` : '';
        const snippet = it.kind === 'comment' ? (it.text.length > 80 ? it.text.slice(0, 80) + '…' : it.text) : '';
        return `<div class="inbox-row">
          <div><span class="new-dot"></span>${icon} <strong>${escapeHtml(label)}</strong> — ${escapeHtml(it.proj.name)}
            <div class="brand-sub" style="margin-top:2px">${where}${snippet ? ` · ${escapeHtml(snippet)}` : ''}</div></div>
          <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();openStudentNotif('${it.proj.id}', '${it.cat ? it.cat.id : ''}', '${it.task ? it.task.id : ''}', '${it.kind}')">${escapeHtml(t('stNotifOpen'))}</button>
        </div>`;
      }).join('');
    }

    function openStudentNotif(projectId, catId, taskId, kind) {
      document.getElementById('notif-panel').classList.add('hidden');
      appState.activeProjectId = projectId;
      appState.activeTab = 'workspace';
      if (kind === 'grade') {
        const pr = ((appState.currentUser && appState.currentUser.projects) || []).find(p => p.id === projectId);
        if (pr && pr.gradeNotif && !pr.gradeNotif.seen) { pr.gradeNotif.seen = true; saveStudentsToStorage(); }
        renderAll();
        return;
      }
      renderAll();
      openTaskModal(catId, taskId);
    }

    function updateNotifBell() {
      const wrap = document.getElementById('notif-wrap');
      if (!wrap) return;
      if (!appState.currentUser || (appState.userType !== 'professor' && appState.userType !== 'student')) {
        wrap.classList.add('hidden');
        return;
      }
      wrap.classList.remove('hidden');
      if (appState.userType === 'student') {
        const items = collectStudentNotifs();
        const sb = document.getElementById('notif-badge');
        sb.textContent = items.length;
        sb.classList.toggle('hidden', items.length === 0);
        document.getElementById('notif-btn').classList.toggle('has-new', items.length > 0);
        document.getElementById('notif-btn').title = t('inboxTitle');
        document.getElementById('notif-panel').innerHTML = `
          <div class="field-label" style="margin:0 0 8px">${escapeHtml(t('inboxTitle'))} (${items.length})</div>
          ${studentInboxHtml(items)}
        `;
        return;
      }
      const groups = collectProfInbox(appState.currentUser.id);
      const vis = collectVisNotifs(appState.currentUser.id);
      const n = groups.length;   // "went private / public" notices stay in the panel but never count, glow or toast
      const badge = document.getElementById('notif-badge');
      badge.textContent = n;
      badge.classList.toggle('hidden', n === 0);
      document.getElementById('notif-btn').classList.toggle('has-new', groups.some(g => g.unread));
      document.getElementById('notif-btn').title = t('inboxTitle');

      document.getElementById('notif-panel').innerHTML = `
        <div class="field-label" style="margin:0 0 8px">${escapeHtml(t('inboxTitle'))} (${n})</div>
        ${inboxHtml(groups, vis, 'bell')}
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
    const closedYearSections = new Set();
    function toggleYearSection(key, isOpen) {
      if (isOpen) closedYearSections.delete(key); else closedYearSections.add(key);
    }

    function profToggleArchive(studentId, projectId) {
      if (appState.userType !== 'professor') return;
      const stu = studentsData.find(s => s.id === studentId);
      const proj = stu && (stu.projects || []).find(p => p.id === projectId);
      if (!proj) return;
      proj.archivedByProf = !proj.archivedByProf;
      persistProject(normalizeProject(proj), studentId);
      showToast(t(proj.archivedByProf ? 'archivedToast' : 'unarchivedToast'));
      renderProfessorDashboard();
    }

    function stuInitials(stu) {
      const parts = String(stu.name || '?').trim().split(/\s+/);
      return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    }

    function profProjectCardHtml(stu, rawProj) {
      const proj = normalizeProject(rawProj);
      const stats = computeProgressStats(proj);
      const finalGrade = (proj.grades && proj.grades.final) ? proj.grades.final : '—';
      const archived = isArchivedFor(proj, 'professor');
      let archiveCtl;
      if (proj.archivedByProf) archiveCtl = `<button type="button" class="btn btn-sm" onclick="profToggleArchive('${stu.id}', '${proj.id}')">${escapeHtml(t('unarchiveBtn'))}</button>`;
      else if (proj.archivedByStudent) archiveCtl = `<span class="badge">${escapeHtml(t('archivedByStudentLbl'))}</span>`;
      else archiveCtl = `<button type="button" class="btn btn-sm" onclick="profToggleArchive('${stu.id}', '${proj.id}')">${escapeHtml(t('archiveBtn'))}</button>`;

      return `
        <div class="stu-tile ${archived ? 'is-archived' : ''}">
          <div class="stu-tile-head">
            <div class="stu-avatar">${escapeHtml(stuInitials(stu))}</div>
            <div class="stu-tile-id">
              <div class="stu-name" title="${escapeHtml(stu.name)}">${escapeHtml(stu.name)}</div>
              <div class="brand-sub mono">${escapeHtml(stu.indexId)}</div>
            </div>
          </div>
          <div class="stu-proj" title="${escapeHtml(proj.name)}">${escapeHtml(proj.name)}</div>
          <div>
            <div class="progress-track" style="margin-top:0">
              <div class="progress-fill-approved" style="width:${stats.approvedPct}%"></div>
              <div class="progress-fill-review" style="width:${stats.reviewPct}%"></div>
            </div>
            <div class="stu-tile-meta">
              <span class="mono" style="color:#86efac">${stats.approvedPct}%</span>
              ${stats.review > 0 ? `<span class="badge badge-review" title="${escapeHtml(t('waitingBadge', stats.review))}">${ic('hourglass')} ${stats.review}</span>` : ''}
              <span class="mono" style="margin-left:auto" title="${escapeHtml(t('gradeLbl'))}">${escapeHtml(finalGrade)}</span>
            </div>
          </div>
          <div class="stu-tile-actions">
            ${archiveCtl}
            <button type="button" class="btn btn-primary btn-sm" onclick="inspectStudentProject('${stu.id}', '${proj.id}')">${escapeHtml(t('inspectStudentBtn'))}</button>
          </div>
        </div>`;
    }

    function profEmptyStudentCardHtml(stu) {
      return `
        <div class="stu-tile">
          <div class="stu-tile-head">
            <div class="stu-avatar">${escapeHtml(stuInitials(stu))}</div>
            <div class="stu-tile-id">
              <div class="stu-name" title="${escapeHtml(stu.name)}">${escapeHtml(stu.name)}</div>
              <div class="brand-sub mono">${escapeHtml(stu.indexId)}</div>
            </div>
          </div>
          <div class="brand-sub">${escapeHtml(t('noPublicProjects'))}</div>
        </div>`;
    }

    function renderProfessorDashboard() {
      const profId = appState.currentUser ? appState.currentUser.id : '';
      const allGroups = collectProfInbox(profId);
      const allVis = collectVisNotifs(profId);
      const pendingByYear = {};
      allGroups.forEach(g => { const y = yearOfStudent(g.stu); pendingByYear[y] = (pendingByYear[y] || 0) + g.approvals.length + g.questions.length; });
      const pendingAll = Object.values(pendingByYear).reduce((s, n) => s + n, 0);

      const years = ['ALL', '1', '2', '3', '4'];
      const tabsWrap = document.getElementById('prof-year-tabs');
      tabsWrap.innerHTML = years.map(y => {
        const active = appState.profYearFilter === y;
        const label = y === 'ALL' ? t('allYears') : t('yearShort', y);
        const n = y === 'ALL' ? pendingAll : (pendingByYear[Number(y)] || 0);
        return `
          <button type="button" class="btn btn-sm ${active ? 'btn-primary' : ''}" onclick="selectProfYear('${y}')">
            ${escapeHtml(label)}${n ? ` <span class="notif-badge" style="position:static;display:inline-block;margin-left:4px">${n}</span>` : ''}
          </button>
        `;
      }).join('');

      const filteredStudents = appState.profYearFilter === 'ALL'
        ? studentsData
        : studentsData.filter(s => String(yearOfStudent(s)) === appState.profYearFilter);

      // Notifications: type filter -> year -> project
      const queueBox = document.getElementById('prof-approval-queue');
      const groups = collectProfInbox(profId, filteredStudents);
      const vis = collectVisNotifs(profId, filteredStudents);
      const nTotal = groups.length + vis.length;
      if (nTotal > 0) {
        queueBox.classList.remove('hidden');
        queueBox.innerHTML = `
          <h3 style="margin:0 0 10px;font-size:14px;font-weight:600;color:#fcd34d">${ic('inbox')} ${escapeHtml(t('inboxTitle'))} (${nTotal})</h3>
          ${inboxHtml(groups, vis, 'dash')}
        `;
      } else {
        queueBox.classList.add('hidden');
      }
      updateNotifBell();

      // Students grouped by study year (one card per project, archived ones in their own section)
      const grid = document.getElementById('prof-students-grid');
      if (filteredStudents.length === 0) {
        grid.innerHTML = `
          <div class="card" style="text-align:center;color:var(--text-secondary)">
            ${escapeHtml(t('noStudentsYear'))}
          </div>
        `;
        return;
      }

      const yearKeys = [...new Set(filteredStudents.map(yearOfStudent))].sort((x, y) => x - y);
      grid.innerHTML = yearKeys.map(y => {
        const studs = filteredStudents.filter(s => yearOfStudent(s) === y).sort((p, q) => (p.name || '').localeCompare(q.name || ''));
        const cards = [], archived = [];
        studs.forEach(stu => {
          const projs = stu.projects || [];
          const live = projs.filter(p => !isArchivedFor(p, 'professor'));
          const arch = projs.filter(p => isArchivedFor(p, 'professor'));
          if (!projs.length) cards.push(profEmptyStudentCardHtml(stu));
          live.forEach(p => cards.push(profProjectCardHtml(stu, p)));
          arch.forEach(p => archived.push(profProjectCardHtml(stu, p)));
        });
        const key = 'y' + y;
        const archKey = 'arch' + y;
        const pend = pendingByYear[y] || 0;
        return `
          <details class="year-section" ${closedYearSections.has(key) ? '' : 'open'} ontoggle="toggleYearSection('${key}', this.open)">
            <summary>
              <span><strong>${escapeHtml(t('yearShort', y))}</strong> <span class="brand-sub mono">(${escapeHtml(t('studentsCount', studs.length))})</span></span>
              <span>${pend ? `<span class="badge badge-review">${pend}</span>` : ''}</span>
            </summary>
            <div class="year-body">
              ${cards.length ? `<div class="tile-grid">${cards.join('')}</div>` : ''}
              ${archived.length ? `
                <details class="inbox-group" style="margin-top:12px" ${openInbox.has(archKey) ? 'open' : ''} ontoggle="toggleInboxGroup('${archKey}', this.open)">
                  <summary><span>${escapeHtml(t('archivedSection', archived.length))}</span></summary>
                  <div class="inbox-items"><div class="tile-grid">${archived.join('')}</div></div>
                </details>` : ''}
            </div>
          </details>`;
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
      proj.gradeNotif = { ts: Date.now(), seen: false };

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
        startAdminListeners();
        renderAll();
      } else {
        const box = document.getElementById('ag-error');
        box.textContent = t('adminBadErr');
        box.classList.remove('hidden');
      }
    }

    function closeSettings() {
      appState.adminOpen = false;
      stopAdminListeners();
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
      document.getElementById('settings-stu-title').textContent = t('settingsStuTitle');
      document.getElementById('settings-stu-sub').textContent = t('settingsStuSub');
      document.getElementById('stu-search').placeholder = t('stuSearchPh');
      document.getElementById('as-title').textContent = t('stuEditTitle');
      document.getElementById('lbl-as-fname').textContent = t('firstName');
      document.getElementById('lbl-as-lname').textContent = t('lastName');
      document.getElementById('lbl-as-index').textContent = t('indexId');
      document.getElementById('lbl-as-year').textContent = t('studyYear');
      document.getElementById('btn-as-submit').textContent = t('stuSaveBtn');
      renderSettingsProfessors();
      renderSettingsStudents();
      renderTemplateEditor();
    }

    /* ---- admin: students (view, edit, new password, delete) ---- */
    function startAdminListeners() {
      stopAdminListeners();
      if (!db) return;
      adminUnsubs.push(db.collection('users').where('role', '==', 'student').onSnapshot(snap => {
        adminStudents = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (!adminBackfilled) { adminBackfilled = true; backfillLogins(); }
        if (appState.adminOpen) renderSettingsStudents();
      }, err => { console.error('admin students', err); showToast(authErrMsg(err)); }));
      adminUnsubs.push(db.collection('projects').onSnapshot(snap => {
        adminProjects = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (appState.adminOpen) renderSettingsStudents();
      }, err => console.error('admin projects', err)));
    }

    function stopAdminListeners() {
      adminUnsubs.forEach(fn => { try { fn(); } catch (e) {} });
      adminUnsubs = [];
      adminStudents = [];
      adminProjects = [];
    }

    // older accounts log in with <index>@students.animpipe.app — record that in the logins collection once
    async function backfillLogins() {
      for (const s of adminStudents) {
        if (s.authEmail || !s.indexId) continue;
        try {
          const ref = db.collection('logins').doc(indexSlug(s.indexId));
          const snap = await ref.get();
          if (!snap.exists) await ref.set({ email: indexToEmail(s.indexId), uid: s.id, indexId: s.indexId });
        } catch (e) { console.warn('backfill logins', e); }
      }
    }

    function adminStuSearch(v) { adminStuQuery = v || ''; renderSettingsStudents(); }

    function adminStudentRowHtml(s) {
      const projs = adminProjects.filter(p => p.studentId === s.id);
      const projHtml = projs.length ? projs.map(p => {
        const st = computeProgressStats(normalizeProject(p));
        const arch = p.archivedByProf ? t('archivedByProfLbl') : (p.archivedByStudent ? t('archivedLbl') : '');
        return `<span class="badge" style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px">
          ${escapeHtml(p.name)} · ${escapeHtml(t(p.isPublic ? 'publicLbl' : 'privateLbl'))}${arch ? ' · ' + escapeHtml(arch) : ''} · ${st.approvedPct}%
          <button type="button" title="${escapeHtml(t('stuDeleteBtn'))}" style="background:none;border:0;padding:0;color:inherit;cursor:pointer;font-size:14px;line-height:1" onclick="adminDeleteProject('${p.id}')">×</button></span>`;
      }).join('') : `<span class="brand-sub">${escapeHtml(t('noProjectsYet'))}</span>`;
      return `
        <div class="prof-card" style="flex-direction:column;align-items:stretch;gap:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <div>
              <div style="font-weight:600;font-size:14px">${escapeHtml(s.name)}</div>
              <div class="brand-sub mono">${escapeHtml(s.indexId)}${s.googleEmail ? ' · ' + escapeHtml(s.googleEmail) : ''}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="btn btn-sm" onclick="adminOpenStudentEdit('${s.id}')">${escapeHtml(t('stuEditBtn'))}</button>
              <button type="button" class="btn btn-sm" onclick="adminSetStudentPassword('${s.id}')">${escapeHtml(t('stuPassBtn'))}</button>
              <button type="button" class="btn btn-sm btn-danger" onclick="adminDeleteStudent('${s.id}')">✕ ${escapeHtml(t('stuDeleteBtn'))}</button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${projHtml}</div>
        </div>`;
    }

    function renderSettingsStudents() {
      const box = document.getElementById('settings-students');
      if (!box) return;
      const q = adminStuQuery.trim().toLowerCase();
      const list = adminStudents.filter(s => !q || String(s.name || '').toLowerCase().includes(q) || String(s.indexId || '').toLowerCase().includes(q));
      document.getElementById('settings-stu-count').textContent = adminStudents.length;
      if (!list.length) { box.innerHTML = `<div class="brand-sub">${escapeHtml(t('noStudentsAdmin'))}</div>`; return; }
      const years = [...new Set(list.map(yearOfStudent))].sort((x, y) => x - y);
      box.innerHTML = years.map(y => {
        const studs = list.filter(s => yearOfStudent(s) === y).sort((p, r) => (p.name || '').localeCompare(r.name || ''));
        const key = 'a' + y;
        return `
          <details class="year-section" ${closedYearSections.has(key) ? '' : 'open'} ontoggle="toggleYearSection('${key}', this.open)">
            <summary><span><strong>${escapeHtml(t('yearShort', y))}</strong> <span class="brand-sub mono">(${escapeHtml(t('studentsCount', studs.length))})</span></span></summary>
            <div class="year-body">${studs.map(adminStudentRowHtml).join('')}</div>
          </details>`;
      }).join('');
    }

    function adminOpenStudentEdit(uid) {
      const s = adminStudents.find(x => x.id === uid);
      if (!s) return;
      document.getElementById('as-uid').value = uid;
      document.getElementById('as-fname').value = s.firstName || (s.name || '').split(' ')[0] || '';
      document.getElementById('as-lname').value = s.lastName || (s.name || '').split(' ').slice(1).join(' ') || '';
      document.getElementById('as-index').value = s.indexId || '';
      document.getElementById('as-year').value = String(yearOfStudent(s));
      document.getElementById('as-error').classList.add('hidden');
      document.getElementById('admin-student-modal').classList.remove('hidden');
    }

    async function adminSaveStudent(e) {
      e.preventDefault();
      const uid = document.getElementById('as-uid').value;
      const s = adminStudents.find(x => x.id === uid);
      if (!s) return;
      const firstName = document.getElementById('as-fname').value.trim();
      const lastName = document.getElementById('as-lname').value.trim();
      const indexId = document.getElementById('as-index').value.trim();
      const studyYear = Number(document.getElementById('as-year').value) || 1;
      if (!firstName || !lastName || !indexId) return;
      const errBox = document.getElementById('as-error');
      const btn = document.getElementById('btn-as-submit');
      btn.disabled = true;
      try {
        const oldSlug = indexSlug(s.indexId), newSlug = indexSlug(indexId);
        if (newSlug !== oldSlug) {
          const ex = await db.collection('logins').doc(newSlug).get();
          if (ex.exists && ex.data().uid !== uid) { errBox.textContent = t('dupIndexErr'); errBox.classList.remove('hidden'); return; }
        }
        const oldRef = db.collection('logins').doc(oldSlug);
        const oldLogin = await oldRef.get();
        const loginEmail = (oldLogin.exists && oldLogin.data().email) || s.authEmail || indexToEmail(s.indexId);
        const batch = db.batch();
        batch.update(db.collection('users').doc(uid), { firstName, lastName, name: `${firstName} ${lastName}`, indexId, studyYear });
        if (newSlug !== oldSlug && oldLogin.exists && oldLogin.data().uid === uid) batch.delete(oldRef);
        batch.set(db.collection('logins').doc(newSlug), { email: loginEmail, uid, indexId });
        await batch.commit();
        closeModal('admin-student-modal');
        showToast(t('stuSaved'));
      } catch (err) {
        console.error(err);
        errBox.textContent = authErrMsg(err);
        errBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
      }
    }

    // The client SDK cannot change another user's password, so the student gets a NEW sign-in account with the new
    // password; the profile and all projects are moved onto it (same name / index / year / projects).
    async function adminSetStudentPassword(uid) {
      const s = adminStudents.find(x => x.id === uid);
      if (!s) return;
      const pass = window.prompt(t('stuNewPassPrompt', s.name), '');
      if (pass === null) return;
      if (pass.length < 6) { showToast(t('weakPassErr')); return; }
      try {
        if (!secondaryApp) secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, 'secondary');
        const sAuth = secondaryApp.auth();
        const email2 = newStudentEmail(s.indexId);
        const cred = await sAuth.createUserWithEmailAndPassword(email2, pass);
        const newUid = cred.user.uid;
        const profile = { ...s };
        delete profile.id;
        profile.authEmail = email2;
        profile.passwordResetAt = Date.now();
        await secondaryApp.firestore().collection('users').doc(newUid).set(profile);
        await sAuth.signOut();

        const snap = await db.collection('projects').where('studentId', '==', uid).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.update(d.ref, { studentId: newUid }));
        batch.set(db.collection('logins').doc(indexSlug(s.indexId)), { email: email2, uid: newUid, indexId: s.indexId });
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
        showToast(t('stuPassDone', s.name));
      } catch (err) {
        console.error(err);
        showToast(authErrMsg(err));
      }
    }

    async function adminDeleteStudent(uid) {
      const s = adminStudents.find(x => x.id === uid);
      if (!s) return;
      const pc = adminProjects.filter(p => p.studentId === uid).length;
      if (!window.confirm(t('stuDeleteConfirm', s.name, pc))) return;
      try {
        const snap = await db.collection('projects').where('studentId', '==', uid).get();
        const lg = await db.collection('logins').doc(indexSlug(s.indexId)).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        batch.delete(db.collection('users').doc(uid));
        if (lg.exists && lg.data().uid === uid) batch.delete(lg.ref);
        await batch.commit();
        showToast(t('stuDeleted'));
      } catch (err) {
        console.error(err);
        showToast(authErrMsg(err));
      }
    }

    async function adminDeleteProject(pid) {
      const p = adminProjects.find(x => x.id === pid);
      if (!p || !window.confirm(t('projDeleteConfirm', p.name))) return;
      try { await db.collection('projects').doc(pid).delete(); }
      catch (err) { showToast(authErrMsg(err)); }
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
        driveLabel.textContent = proj.name;
        drivePill.title = proj.name;
      } else {
        driveLabel.textContent = 'Drive';
        drivePill.title = 'Drive';
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

    window.addEventListener('resize', () => positionTodayLine());
    document.addEventListener('click', e => document.querySelectorAll('details.dots[open]').forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); }));

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
