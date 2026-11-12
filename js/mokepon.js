// Variables globales y selectores DOM
const sectionSeleccionarAtaque = document.getElementById('seleccionar-ataque');
const sectionReiniciar = document.getElementById('reiniciar');
const botonMascotaJugador = document.getElementById('boton-mascota');
const botonReiniciar = document.getElementById('boton-reiniciar');
const sectionSeleccionarMascota = document.getElementById('seleccionar-mascota');
const spanMascotaJugador = document.getElementById('mascota-jugador');
const spanMascotaEnemigo = document.getElementById('mascota-enemigo');
const spanVidasJugador = document.getElementById('vidas-jugador');
const spanVidasEnemigo = document.getElementById('vidas-enemigo');
const sectionMensajes = document.getElementById('resultado');
const ataquesDelJugador = document.getElementById('ataques-del-jugador');
const ataquesDelEnemigo = document.getElementById('ataques-del-enemigo');
const contenedorTarjetas = document.getElementById('contenedorTarjetas');
const contenedorAtaques = document.getElementById('contenedorAtaques');
const sectionVerMapa = document.getElementById('ver-mapa');
const mapa = document.getElementById('mapa');
const sectionInicio = document.getElementById('pantalla-inicio');
const botonStart = document.getElementById('boton-start');

// Configuración
const API_URL = 'http://192.168.10.116:8080';
const INTERVALO_REFRESCO = 50;

// Estado del juego
let jugadorId = null;
let enemigoId = null;
let mokepones = [];
let mokeponesEnemigos = [];
let ataqueJugador = [];
let ataqueEnemigo = [];
let inputHipodoge;
let inputCapipepo;
let inputRatigueya;
let mascotaJugador;
let mascotaJugadorObjeto;
let ataquesMokepon;
let ataquesMokeponEnemigo;
let botones = [];
let indexAtaqueJugador;
let indexAtaqueEnemigo;
let victoriasJugador = 0;
let victoriasEnemigo = 0;
let vidasJugador = 3;
let vidasEnemigo = 3;
let intervalo;

// Configuración del canvas
const lienzo = mapa.getContext("2d");
let mapaBackground = new Image();
mapaBackground.src = './assets/mokemap.png';
const anchoMaximoDelMapa = 350;
let anchoDelMapa = window.innerWidth - 20;
let alturaQueBuscamos;

// Ajustar dimensiones del mapa
if (anchoDelMapa > anchoMaximoDelMapa) {
    anchoDelMapa = anchoMaximoDelMapa - 20;
}
alturaQueBuscamos = anchoDelMapa * 600 / 800;
mapa.width = anchoDelMapa;
mapa.height = alturaQueBuscamos;

// Audio background
const bgmMain = document.getElementById('bgm-main');

/**
 * Clase Mokepon para gestionar las criaturas del juego
 */
class Mokepon {
    constructor(nombre, foto, vida, fotoMapa, id = 0) {
        this.id = id;
        this.nombre = nombre;
        this.foto = foto;
        this.vida = vida;
        this.ataques = [];
        this.ancho = 40;
        this.alto = 40;
        this.x = aleatorio(0, mapa.width - this.ancho);
        this.y = aleatorio(0, mapa.height - this.alto);
        this.mapaFoto = new Image();
        this.mapaFoto.src = fotoMapa;
        this.velocidadX = 0;
        this.velocidadY = 0;
    }

    pintarMokepon() {
        lienzo.drawImage(
            this.mapaFoto,
            this.x,
            this.y,
            this.ancho,
            this.alto
        );
    }
}

// Definición de Mokepones disponibles
const hipodoge = new Mokepon('Hipodoge', './assets/mokepons_mokepon_hipodoge_attack.png', 5, './assets/hipodoge.png');
const capipepo = new Mokepon('Capipepo', './assets/mokepons_mokepon_capipepo_attack.png', 5, './assets/capipepo.png');
const ratigueya = new Mokepon('Ratigueya', './assets/mokepons_mokepon_ratigueya_attack.png', 5, './assets/ratigueya.png');

// Definición de ataques para cada Mokepon
const HIPODOGE_ATAQUES = [
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🔥', id: 'boton-fuego' },
    { nombre: '🌱', id: 'boton-tierra' },
];

const CAPIPEPO_ATAQUES = [
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🔥', id: 'boton-fuego' },
];

const RATIGUEYA_ATAQUES = [
    { nombre: '🔥', id: 'boton-fuego' },
    { nombre: '🔥', id: 'boton-fuego' },
    { nombre: '🔥', id: 'boton-fuego' }, 
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🌱', id: 'boton-tierra' },
];

// Asignar ataques a cada Mokepon
hipodoge.ataques.push(...HIPODOGE_ATAQUES);
capipepo.ataques.push(...CAPIPEPO_ATAQUES);
ratigueya.ataques.push(...RATIGUEYA_ATAQUES);
mokepones.push(hipodoge, capipepo, ratigueya);

/**
 * Función para iniciar el juego
 */
function iniciarJuego() {
    // Ocultar secciones no necesarias al inicio
    ocultarSecciones();
    
    // Generar tarjetas de Mokepon
    generarTarjetasMokepones();
    
    // Event listeners principales
    botonMascotaJugador.addEventListener('click', seleccionarMascotaJugador);
    botonReiniciar.addEventListener('click', reiniciarJuego);
    botonStart.addEventListener('click', iniciarPartida);
    
    // Iniciar la música de fondo
    bgmMain.volume = 0.3;
    
    // Conectar con el servidor
    unirseAlJuego();
}

/**
 * Oculta todas las secciones excepto la de inicio
 */
function ocultarSecciones() {
    sectionSeleccionarAtaque.style.display = 'none';
    sectionVerMapa.style.display = 'none';
    sectionSeleccionarMascota.style.display = 'none';
    sectionReiniciar.style.display = 'none';
    sectionInicio.style.display = 'flex';
}

/**
 * Inicia el juego después de presionar START
 */
function iniciarPartida() {
    sectionInicio.style.display = 'none';
    sectionSeleccionarMascota.style.display = 'flex';
    bgmMain.play();
}

/**
 * Genera las tarjetas de los Mokepones disponibles
 */
function generarTarjetasMokepones() {
    mokepones.forEach((mokepon) => {
        const opcionDeMokepones = `
        <input type="radio" name="mascota" id=${mokepon.nombre} />
        <label class="tarjeta-de-mokepon" for=${mokepon.nombre}>
            <p>${mokepon.nombre}</p>
            <img src=${mokepon.foto} alt=${mokepon.nombre}>
        </label>
        `;
        contenedorTarjetas.innerHTML += opcionDeMokepones;
    });

    inputHipodoge = document.getElementById('Hipodoge');
    inputCapipepo = document.getElementById('Capipepo');
    inputRatigueya = document.getElementById('Ratigueya');
}

/**
 * Conectar con el servidor del juego
 */
function unirseAlJuego() {
    fetch(`${API_URL}/unirse`)
        .then((res) => {
            if (res.ok) {
                return res.text();
            }
            throw new Error('Error al unirse al juego');
        })
        .then((respuesta) => {
            console.log('ID del jugador:', respuesta);
            jugadorId = respuesta;
        })
        .catch((error) => {
            console.error('Error en la conexión:', error);
        });
}

/**
 * Seleccionar la mascota del jugador
 */
function seleccionarMascotaJugador() {
    if (inputHipodoge.checked) {
        spanMascotaJugador.innerHTML = inputHipodoge.id;
        mascotaJugador = inputHipodoge.id;
    } else if (inputCapipepo.checked) {
        spanMascotaJugador.innerHTML = inputCapipepo.id;
        mascotaJugador = inputCapipepo.id;
    } else if (inputRatigueya.checked) {
        spanMascotaJugador.innerHTML = inputRatigueya.id;
        mascotaJugador = inputRatigueya.id;
    } else {
        alert('Selecciona una mascota');
        return;
    }

    sectionSeleccionarMascota.style.display = 'none';

    // Enviar selección al servidor y preparar el juego
    seleccionarMokepon(mascotaJugador);
    extraerAtaques(mascotaJugador);
    sectionVerMapa.style.display = 'flex';
    iniciarMapa();
}

/**
 * Enviar la selección de Mokepon al servidor
 * @param {string} mascotaJugador - Nombre del Mokepon seleccionado
 */
function seleccionarMokepon(mascotaJugador) {
    fetch(`${API_URL}/mokepon/${jugadorId}`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mokepon: mascotaJugador
        })
    })
    .catch(error => console.error('Error al seleccionar mokepon:', error));
}

/**
 * Obtener los ataques disponibles para la mascota seleccionada
 * @param {string} mascotaJugador - Nombre del Mokepon seleccionado
 */
function extraerAtaques(mascotaJugador) {
    const mokeponSeleccionado = mokepones.find(mokepon => mokepon.nombre === mascotaJugador);
    
    if (mokeponSeleccionado) {
        mostrarAtaques(mokeponSeleccionado.ataques);
    }
}

/**
 * Mostrar los botones de ataque disponibles
 * @param {Array} ataques - Lista de ataques disponibles
 */
function mostrarAtaques(ataques) {
    contenedorAtaques.innerHTML = '';
    
    ataques.forEach((ataque) => {
        const botonAtaque = `
        <button id=${ataque.id} class="boton-de-ataque BAtaque">${ataque.nombre}</button>
        `;
        contenedorAtaques.innerHTML += botonAtaque;
    });

    botones = document.querySelectorAll('.BAtaque');
}

/**
 * Configurar los eventos de los botones de ataque
 */
function secuenciaAtaque() {
    botones.forEach((boton) => {
        boton.addEventListener('click', (e) => {
            const tipoAtaque = e.target.textContent;
            let nombreAtaque;
            
            switch (tipoAtaque) {
                case '🔥':
                    nombreAtaque = 'FUEGO';
                    break;
                case '💧':
                    nombreAtaque = 'AGUA';
                    break;
                case '🌱':
                    nombreAtaque = 'TIERRA';
                    break;
                default:
                    return;
            }
            
            ataqueJugador.push(nombreAtaque);
            console.log('Ataque seleccionado:', nombreAtaque);
            
            // Deshabilitar botón después de usarlo
            boton.style.background = '#112f58';
            boton.disabled = true;
            
            // Verificar si ya se seleccionaron todos los ataques
            if (ataqueJugador.length === 5) {
                enviarAtaques();
            }
        });
    });
}

/**
 * Enviar los ataques seleccionados al servidor
 */
function enviarAtaques() {
    console.log('Enviando ataques:', ataqueJugador);

    fetch(`${API_URL}/mokepon/${jugadorId}/ataques`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ataques: ataqueJugador
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al enviar ataques');
        }
        // Empezar a consultar los ataques del enemigo
        intervalo = setInterval(obtenerAtaques, INTERVALO_REFRESCO);
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Obtener los ataques del enemigo desde el servidor
 */
function obtenerAtaques() {
    fetch(`${API_URL}/mokepon/${enemigoId}/ataques`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Error al obtener ataques del enemigo');
        })
        .then(data => {
            if (data.ataques && data.ataques.length === 5) {
                ataqueEnemigo = data.ataques;
                combate();
            }
        })
        .catch(error => console.error('Error:', error));
}

/**
 * Seleccionar la mascota del enemigo
 * @param {Object} enemigo - Objeto con la información del enemigo
 */
function seleccionarMascotaEnemigo(enemigo) {
    spanMascotaEnemigo.innerHTML = enemigo.nombre;
    ataquesMokeponEnemigo = enemigo.ataques;
    secuenciaAtaque();
}

/**
 * Registrar el índice de los ataques de ambos oponentes
 * @param {number} jugador - Índice del ataque del jugador
 * @param {number} enemigo - Índice del ataque del enemigo
 */
function indexAmbosOponente(jugador, enemigo) {
    indexAtaqueJugador = ataqueJugador[jugador];
    indexAtaqueEnemigo = ataqueEnemigo[enemigo];
}

/**
 * Procesar el combate entre el jugador y el enemigo
 */
function combate() {
    clearInterval(intervalo);
    console.log('Iniciando combate');
    
    for (let index = 0; index < ataqueJugador.length; index++) {
        const ataqueJ = ataqueJugador[index];
        const ataqueE = ataqueEnemigo[index];
        
        if (ataqueJ === ataqueE) {
            indexAmbosOponente(index, index);
            crearMensaje("EMPATE");
        } else if (
            (ataqueJ === 'FUEGO' && ataqueE === 'TIERRA') ||
            (ataqueJ === 'AGUA' && ataqueE === 'FUEGO') ||
            (ataqueJ === 'TIERRA' && ataqueE === 'AGUA')
        ) {
            indexAmbosOponente(index, index);
            crearMensaje("GANASTE");
            victoriasJugador++;
            spanVidasJugador.innerHTML = victoriasJugador;
        } else {
            indexAmbosOponente(index, index);
            crearMensaje("PERDISTE");
            victoriasEnemigo++;
            spanVidasEnemigo.innerHTML = victoriasEnemigo;
        }
    }

    revisarVidas();
}

/**
 * Verificar el resultado final del combate
 */
function revisarVidas() {
    if (victoriasJugador === victoriasEnemigo) {
        crearMensajeFinal("Esto fue un empate!!!");
    } else if (victoriasJugador > victoriasEnemigo) {
        crearMensajeFinal("¡FELICITACIONES! Ganaste :)");
    } else {
        crearMensajeFinal('Lo siento, perdiste :(');
    }
}

/**
 * Crear mensaje de resultado para cada ataque
 * @param {string} resultado - Resultado del ataque (GANASTE, PERDISTE, EMPATE)
 */
function crearMensaje(resultado) {
    const nuevoAtaqueDelJugador = document.createElement('p');
    const nuevoAtaqueDelEnemigo = document.createElement('p');

    sectionMensajes.innerHTML = resultado;
    nuevoAtaqueDelJugador.innerHTML = indexAtaqueJugador;
    nuevoAtaqueDelEnemigo.innerHTML = indexAtaqueEnemigo;

    ataquesDelJugador.appendChild(nuevoAtaqueDelJugador);
    ataquesDelEnemigo.appendChild(nuevoAtaqueDelEnemigo);
}

/**
 * Crear mensaje final del combate
 * @param {string} resultadoFinal - Resultado final del combate
 */
function crearMensajeFinal(resultadoFinal) {
    sectionMensajes.innerHTML = resultadoFinal;
    sectionReiniciar.style.display = 'block';
}

/**
 * Reiniciar el juego
 */
function reiniciarJuego() {
    location.reload();
}

/**
 * Generar un número aleatorio entre min y max (inclusivo)
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Número aleatorio entre min y max
 */
function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Actualizar y dibujar el canvas
 */
function pintarCanvas() {
    // Actualizar posición del jugador
    mascotaJugadorObjeto.x += mascotaJugadorObjeto.velocidadX;
    mascotaJugadorObjeto.y += mascotaJugadorObjeto.velocidadY;
    
    // Limitar movimiento dentro del mapa
    mascotaJugadorObjeto.x = Math.max(0, Math.min(mapa.width - mascotaJugadorObjeto.ancho, mascotaJugadorObjeto.x));
    mascotaJugadorObjeto.y = Math.max(0, Math.min(mapa.height - mascotaJugadorObjeto.alto, mascotaJugadorObjeto.y));
    
    // Limpiar canvas y dibujar elementos
    lienzo.clearRect(0, 0, mapa.width, mapa.height);
    lienzo.drawImage(
        mapaBackground,
        0,
        0,
        mapa.width,
        mapa.height
    );
    
    // Dibujar jugador y enviar posición al servidor
    mascotaJugadorObjeto.pintarMokepon();
    enviarPosicion(mascotaJugadorObjeto.x, mascotaJugadorObjeto.y);

    // Dibujar enemigos y verificar colisiones
    mokeponesEnemigos.forEach(function (mokepon) {
        if (mokepon) {
            mokepon.pintarMokepon();
            revisarColision(mokepon);
        }
    });
}

/**
 * Enviar la posición actual del jugador al servidor
 * @param {number} x - Posición x
 * @param {number} y - Posición y
 */
function enviarPosicion(x, y) {
    fetch(`${API_URL}/mokepon/${jugadorId}/posicion`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ x, y })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Error al enviar posición');
    })
    .then(({ enemigos }) => {
        actualizarEnemigos(enemigos);
    })
    .catch(error => console.error('Error:', error));
}

/**
 * Actualizar la lista de enemigos en el mapa
 * @param {Array} enemigos - Lista de enemigos del servidor
 */
function actualizarEnemigos(enemigos) {
    mokeponesEnemigos = enemigos.map(function (enemigo) {
        const mokeponNombre = enemigo.mokepon?.nombre || "";
        let mokeponEnemigo = null;

        switch (mokeponNombre) {
            case "Hipodoge":
                mokeponEnemigo = new Mokepon('Hipodoge', './assets/mokepons_mokepon_hipodoge_attack.png', 5, './assets/hipodoge.png', enemigo.id);
                break;
            case "Capipepo":
                mokeponEnemigo = new Mokepon('Capipepo', './assets/mokepons_mokepon_capipepo_attack.png', 5, './assets/capipepo.png', enemigo.id);
                break;
            case "Ratigueya":
                mokeponEnemigo = new Mokepon('Ratigueya', './assets/mokepons_mokepon_ratigueya_attack.png', 5, './assets/ratigueya.png', enemigo.id);
                break;
        }

        if (mokeponEnemigo) {
            mokeponEnemigo.x = enemigo.x || 0;
            mokeponEnemigo.y = enemigo.y || 0;
        }

        return mokeponEnemigo;
    }).filter(Boolean); // Filtrar valores nulos
}

/**
 * Funciones de movimiento
 */
function moverDerecha() {
    mascotaJugadorObjeto.velocidadX = 5;
}

function moverIzquierda() {
    mascotaJugadorObjeto.velocidadX = -5;
}

function moverAbajo() {
    mascotaJugadorObjeto.velocidadY = 5;
}

function moverArriba() {
    mascotaJugadorObjeto.velocidadY = -5;
}

function detenerMovimiento() {
    mascotaJugadorObjeto.velocidadX = 0;
    mascotaJugadorObjeto.velocidadY = 0;
}

/**
 * Manejar eventos de teclado
 * @param {KeyboardEvent} event - Evento de teclado
 */
function sePresionoUnaTecla(event) {
    switch (event.key) {
        case 'ArrowUp':
            moverArriba();
            break;
        case 'ArrowDown':
            moverAbajo();
            break;
        case 'ArrowLeft':
            moverIzquierda();
            break;
        case 'ArrowRight':
            moverDerecha();
            break;
        default:
            break;
    }
}

/**
 * Inicializar el mapa de juego
 */
function iniciarMapa() {
    mascotaJugadorObjeto = obtenerObjetoMascota();
    console.log("Mascota seleccionada:", mascotaJugadorObjeto.nombre);
    
    // Iniciar bucle de actualización del mapa
    intervalo = setInterval(pintarCanvas, INTERVALO_REFRESCO);
    
    // Configurar controles
    window.addEventListener('keydown', sePresionoUnaTecla);
    window.addEventListener('keyup', detenerMovimiento);
}

/**
 * Obtener el objeto Mokepon correspondiente a la selección del jugador
 * @returns {Mokepon} - Objeto Mokepon seleccionado
 */
function obtenerObjetoMascota() {
    return mokepones.find(mokepon => mokepon.nombre === mascotaJugador) || mokepones[0];
}

/**
 * Verificar colisión entre el jugador y un enemigo
 * @param {Mokepon} enemigo - Objeto Mokepon enemigo
 */
function revisarColision(enemigo) {
    const arribaEnemigo = enemigo.y;
    const abajoEnemigo = enemigo.y + enemigo.alto;
    const derechaEnemigo = enemigo.x + enemigo.ancho;
    const izquierdaEnemigo = enemigo.x;

    const arribaMascota = mascotaJugadorObjeto.y;
    const abajoMascota = mascotaJugadorObjeto.y + mascotaJugadorObjeto.alto;
    const derechaMascota = mascotaJugadorObjeto.x + mascotaJugadorObjeto.ancho;
    const izquierdaMascota = mascotaJugadorObjeto.x;

    // Verificar si NO hay colisión
    if (
        abajoMascota < arribaEnemigo ||
        arribaMascota > abajoEnemigo ||
        derechaMascota < izquierdaEnemigo ||
        izquierdaMascota > derechaEnemigo
    ) {
        return;
    }

    // Si hay colisión, iniciar combate
    console.log('¡Colisión detectada con', enemigo.nombre, '!');
    detenerMovimiento();
    clearInterval(intervalo);
    
    enemigoId = enemigo.id;
    sectionSeleccionarAtaque.style.display = 'flex';
    sectionVerMapa.style.display = 'none';
    seleccionarMascotaEnemigo(enemigo);
}

// Iniciar el juego cuando la página esté cargada
window.addEventListener('load', iniciarJuego);
