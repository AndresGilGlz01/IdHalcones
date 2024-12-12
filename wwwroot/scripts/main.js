// registro de service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js')
        .then(reg => console.log('service worker registrado'))
        .catch(err => console.error('Error al registrar el service worker', err));
}

let loginForm = document.querySelector('.login form');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let noControl = document.querySelector('#numControl').value;
    let password = document.querySelector('#password').value;
    
    Login(noControl, password);
});

async function Login(noControl, password) {
    let url = new URL("https://idtec.websitos256.com/api/login");

    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({numControl: noControl, contraseña: password})
        });

        let passEncrypted = await response.text();

		localStorage.setItem('password', passEncrypted);
        localStorage.setItem('noControl', noControl)

        // verify 200 status
		if (response.status === 200) {
            window.location.href = '/';
        } else {
            let lblError = document.querySelector('.login-error');
            lblError.textContent = 'Algo salió mal, intente de nuevo';
        }
    }
    catch (error) {
        let lblError = document.querySelector('.login-error');
        lblError.textContent = 'Error al iniciar sesión';
    }
}