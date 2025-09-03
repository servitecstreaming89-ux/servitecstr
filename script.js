// ========== MENÚ HAMBURGUESA ==========
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
});

// ========== FORMULARIO DE CONTACTO ==========
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            alert("✅ Tu mensaje fue enviado correctamente (simulación).");
            form.reset();
        });
    }
});

// ========== HELPERS FIREBASE ==========
function ensureFirebase() {
    if (!window.firebaseAPI) {
        console.error("Firebase no está disponible. Revisa el bloque <script type='module'> en index.html.");
        alert("Error: Firebase no está configurado.");
        return null;
    }
    return window.firebaseAPI;
}

function renderPreview(url, mime, container) {
    if (mime && mime.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = "archivo subido";
        img.classList.add('gallery-item');
        container.appendChild(img);
    } else if (mime && mime.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.classList.add('gallery-item');
        container.appendChild(video);
    } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = "_blank";
        a.textContent = "Ver archivo";
        container.appendChild(a);
    }
}

// ========== SUBIDA DE ARCHIVOS ==========
function uploadFilesToFirebase(inputId, galleryId, folder) {
    const api = ensureFirebase();
    if (!api) return;

    const { storage, ref, uploadBytesResumable, getDownloadURL } = api;

    const input = document.getElementById(inputId);
    const gallery = document.getElementById(galleryId);

    if (!input || !gallery) {
        console.error("No se encontró input o gallery:", inputId, galleryId);
        return;
    }

    Array.from(input.files).forEach(file => {
        const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
        const task = uploadBytesResumable(fileRef, file);

        // Mostrar progreso
        const progress = document.createElement('div');
        progress.textContent = `Subiendo ${file.name}... 0%`;
        progress.style.fontSize = "0.9rem";
        progress.style.margin = "6px 0";
        gallery.appendChild(progress);

        task.on('state_changed',
            (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                progress.textContent = `Subiendo ${file.name}... ${pct}%`;
            },
            (err) => {
                console.error("Error al subir:", err);
                progress.textContent = `❌ Error subiendo ${file.name}`;
            },
            async () => {
                try {
                    const url = await getDownloadURL(task.snapshot.ref);
                    progress.remove();
                    renderPreview(url, file.type, gallery);
                } catch (e) {
                    console.error("Error al obtener URL:", e);
                    progress.textContent = `❌ Error al obtener URL de ${file.name}`;
                }
            }
        );
    });
}

// ========== FUNCIONES CONECTADAS A BOTONES ==========
function uploadServicios() {
    uploadFilesToFirebase('serviciosUpload', 'serviciosGallery', 'servicios');
}

function uploadStreaming() {
    uploadFilesToFirebase('streamingUpload', 'streamingGallery', 'streaming');
}

// ========== CARGAR ARCHIVOS EXISTENTES AL ENTRAR ==========
async function loadGalleryFromFirebase(folder, galleryId) {
    const api = ensureFirebase();
    if (!api) return;
    const { storage, ref, listAll, getDownloadURL } = api;

    const gallery = document.getElementById(galleryId);
    if (!gallery) return;

    try {
        const folderRef = ref(storage, folder);
        const { items } = await listAll(folderRef);

        for (const itemRef of items) {
            const url = await getDownloadURL(itemRef);
            // No siempre sabemos el MIME → asumimos imagen
            renderPreview(url, "image/*", gallery);
        }
    } catch (e) {
        console.error(`Error listando ${folder}:`, e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('serviciosGallery')) {
        loadGalleryFromFirebase('servicios', 'serviciosGallery');
    }
    if (document.getElementById('streamingGallery')) {
        loadGalleryFromFirebase('streaming', 'streamingGallery');
    }
});
