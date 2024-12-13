// service-worker.js

let cacheName = "idHalconesV1";

let dbVersion = 2;
let nombreTabla = 'usuario';

async function precache() {
    let cache = await caches.open(cacheName);
    await cache.add("/index");
}
self.addEventListener("install", function (e) {
    e.waitUntil(createDB());
    e.waitUntil(precache());
});

self.addEventListener('fetch', event => {

    if (event.request.method === "POST" && event.request.url.includes("api/login")) {
        event.respondWith(handleLogin(event.request));
    } else if (event.request.url.includes("/api/")) {
        event.respondWith(authenticateRequest(event.request));
    } else {
        event.respondWith(cacheFirst(event.request));
    }
});

let maxage = 7 * 24 * 60 * 60 * 1000;
async function timeBasedCache(req) {
    try {
        let cache = await caches.open(cacheName);
        let cachedResponse = await cache.match(req);

        if (cachedResponse) {
            let fechaDescarga = cachedResponse.headers.get("fecha");

            if (fechaDescarga) {
                let fecha = new Date(fechaDescarga);
                let hoy = new Date();
                let diferencia = hoy - fecha;

                if (diferencia <= maxage) {
                    return cachedResponse;
                }
            }
        }

        let networkResponse = await fetch(req);

        if (networkResponse.ok) {
            let nuevoResponse = new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: networkResponse.headers
            });
            nuevoResponse.headers.append("fecha", new Date().toISOString());  // Añadir la fecha de la descarga
            await cache.put(req, nuevoResponse.clone());  // Guardar en el caché

            return nuevoResponse;
        } else {
            return new Response("Error en la red", { status: 502 });
        }

    } catch (error) {
        console.log("Error en timeBasedCache:", error);
        return new Response("Error interno", { status: 500 });
    }
}


async function authenticateRequest(request) {
    let user = await getById(1);

    if (!user) {
        return Response.redirect('/login', 302);
    }

    const headers = new Headers(request.headers);
    headers.set("numControl", user.noControl);
    headers.set("contra", user.password);

    try {
        const modifiedRequest = new Request(request, { headers });
        const response = await timeBasedCache(modifiedRequest);

        if (response.status === 401) {
            //await deleteById(1);
            return Response.redirect('/login',302);
        }

        return response;
    } catch (err) {
        return new Response('No se puede conectar al servidor', { status: 503 });
    }

}

async function cacheFirst(req) {
    try {
        let cache = await caches.open(cacheName);
        let response = await cache.match(req);

        if (response) {
            console.log("Cargando desde el caché:", req.url);
            return response;
        } else {
            console.log("No encontrado en caché, solicitando:", req.url);
            let requestClone = req.clone();
            let respuesta = await fetch(req);

            if (respuesta && respuesta.ok) {
                
                cache.put(requestClone, respuesta.clone());
            }

            return respuesta;
        }
    } catch (x) {
        console.error("Error en cacheFirst:", x);
        return new Response("Error fetching the resource: " + req.url, { status: 500 });
    }
}
async function handleLogin(request) {
    let response = await fetch(request);
    if (!response.ok) {
        return response;
    }

    let data = await response.json();

    var json = {
        "id": 1,
        "password": data.contra,
        "noControl": data.numControl,
        "dateLogin": new Date().toISOString()
    };

    addToDB(json);

    if (response.ok) {
        return new Response(JSON.stringify({ redirect: '/index' }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        return response;
    }
}
function createDB() {
    let openRequest = indexedDB.open("informacion", dbVersion);

    openRequest.onupgradeneeded = function () {
        let db = openRequest.result;
        if (!db.objectStoreNames.contains(nombreTabla)) {
            db.createObjectStore(nombreTabla, { keyPath: "id" });
        }
    }

    openRequest.onerror = function () {
        console.error("Error al crear la base de datos");
    };

    openRequest.onsuccess = function () {
        console.log("Base de datos creada con éxito");
    };
}
function addToDB(obj) {
    let openRequest = indexedDB.open("informacion", dbVersion);

    openRequest.onsuccess = function () {
        let db = openRequest.result;
        let transaction = db.transaction(nombreTabla, "readwrite");
        let objectStore = transaction.objectStore(nombreTabla);
        const resultado = objectStore.add(obj);

        resultado.onsuccess = function () {
            console.log("Objeto agregado a la base de datos");
        };

        resultado.onerror = function () {
            console.error("Error al agregar el objeto a la base de datos");
        };
    }
}
function getById(id) {
    return new Promise((resolve, reject) => {
        let openRequest = indexedDB.open("informacion", dbVersion);

        openRequest.onsuccess = function () {
            let db = openRequest.result;
            let transaction = db.transaction(nombreTabla, "readonly");
            let objectStore = transaction.objectStore(nombreTabla);
            const resultado = objectStore.get(id);

            resultado.onsuccess = function () {
                resolve(resultado.result); 
            };

            resultado.onerror = function () {
                reject("Error al obtener datos de la BD"); 
            };
        };

        openRequest.onerror = function () {
            reject("Error al abrir la base de datos");
        };
    });
}