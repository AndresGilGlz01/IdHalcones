let cacheName = "idHalconesV1";
let dbVersion = 1;
let nombreTabla = 'usuarios';
async function precache() {
    let cache = await caches.open(cacheName);
};

self.addEventListener('fetch', event => {
    if (event.request.method === "POST" && event.request.url.includes("api/login")) {
        let response = await fetch(event.request);
        event.respondWith(Login(response));
    }
    else {
        event.respondWith(cacheFirst(event.request));
    }

});

async function cacheFirst(req) {
    try {
        let cache = await caches.open(cacheName);
        let response = await cache.match(req);
        if (response) {
            return response;
        } else {
            let respuesta = await fetch(req);
            if (respuesta && respuesta.ok) { // Verificar si la respuesta es válida
                cache.put(req, respuesta.clone());
            }
            return respuesta;
        }
    } catch (x) {
        return new Response("Error fetching the resource: " + req.url, { status: 500 });
    }
}

function Login(response) {

    if (!response.ok) { return response; }

    let data = await response.json();

    var json = {
        "id": 1,
        "usuario": data.resp,
        "password": data.password,
        "noControl": noControl
    };

    addToDB(json);

    if (data.resp) {
        return Response.redirect('/');
    }
}

function createDB() {
    let openRequest = indexedDB.open("informacion", dbVersion);

    openRequest.onupgradeneeded = function () {
        let db = openRequest.result;
        db.createObjectStore(nombreTabla, "id");
    }

    openRequest.onerror = function () {

    };

    openRequest.onsuccess = function () {

    };
};

function addToDB(obj) {
    let openRequest = indexedDB.open("informacion", dbVersion);

    openRequest.onsuccess = function () {
        let db = openRequest.result;
        let transaction = db.transaction(nombreTabla, "readwrite");
        let objectStore = transaction.objectStore(nombreTabla);
        const resultado = objectStore.add(obj);

        resultado.onsuccess = function () {
        };

        // Si hubo un error al agregar el objeto
        resultado.onerror = function () {
        };
    }
}