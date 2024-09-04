document.addEventListener('DOMContentLoaded', () => {
    cargarExamen();
});

let currentQuestion = 0;
let examData = [];

function cargarExamen() {
    fetch('examen.txt')
        .then(response => response.text())
        .then(text => {
            examData = parseExam(text);
            mostrarPregunta(currentQuestion);
        });
}

function parseExam(text) {
    const preguntas = text.match(/<q>(.*?)<\/q>/g).map(q => q.replace(/<\/?q>/g, ''));
    const opciones = text.match(/<opt>(.*?)<\/opt>/g).map(o => o.replace(/<\/?opt>/g, ''));
    const respuestasCorrectas = text.match(/<ans>(.*?)<\/ans>/g).map(a => a.replace(/<\/?ans>/g, '').split(',').map(Number));
    const explicaciones = text.match(/<exp>(.*?)<\/exp>/g).map(e => e.replace(/<\/?exp>/g, ''));

    const exam = [];
    for (let i = 0; i < preguntas.length; i++) {
        exam.push({
            pregunta: preguntas[i],
            opciones: opciones.slice(i * 4, (i + 1) * 4),
            respuestasCorrectas: respuestasCorrectas[i],
            explicacion: explicaciones[i]
        });
    }
    return exam;
}

function mostrarPregunta(idx) {
    const form = document.getElementById('form-examen');
    form.innerHTML = '';

    if (examData.length > 0) {
        const pregunta = examData[idx];
        const fieldset = document.createElement('fieldset');
        fieldset.id = `pregunta${idx}`;

        const legend = document.createElement('legend');
        legend.textContent = `Pregunta ${idx + 1}`;
        fieldset.appendChild(legend);

        const p = document.createElement('p');
        p.textContent = pregunta.pregunta;
        fieldset.appendChild(p);

        pregunta.opciones.forEach((opcion, j) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = `pregunta${idx}`;
            input.value = j + 1;
            label.appendChild(input);
            label.appendChild(document.createTextNode(opcion));
            fieldset.appendChild(label);
            fieldset.appendChild(document.createElement('br'));
        });

        const button = document.createElement('button');
        button.textContent = 'Mostrar Respuesta Correcta';
        button.onclick = () => mostrarRespuesta(idx);
        fieldset.appendChild(button);

        const respuestaDiv = document.createElement('p');
        respuestaDiv.id = `respuesta-${idx}`;
        respuestaDiv.style.display = 'none';
        respuestaDiv.innerHTML = `<span class="respuesta-correcta">Respuestas Correctas: ${pregunta.respuestasCorrectas.map(i => pregunta.opciones[i - 1]).join(', ')}</span><br><span class="explicacion">${pregunta.explicacion}</span>`;
        fieldset.appendChild(respuestaDiv);

        form.appendChild(fieldset);
        fieldset.classList.add('active');
    }

    document.getElementById('submit-btn').style.display = examData.length > 0 ? 'block' : 'none';
}

function mostrarRespuesta(idx) {
    const respuestaElement = document.getElementById(`respuesta-${idx}`);
    respuestaElement.style.display = 'block';
    const checkboxes = document.querySelectorAll(`#pregunta${idx} input[type="checkbox"]`);
    checkboxes.forEach((checkbox) => {
        if (examData[idx].respuestasCorrectas.includes(parseInt(checkbox.value))) {
            checkbox.parentElement.classList.add('respuesta-correcta');
        } else {
            checkbox.parentElement.classList.add('respuesta-incorrecta');
        }
    });
}

function cambiarPregunta(direccion) {
    const preguntas = document.querySelectorAll('fieldset');
    preguntas[currentQuestion].classList.remove('active');
    currentQuestion += direccion;
    if (currentQuestion < 0) currentQuestion = 0;
    if (currentQuestion >= preguntas.length) currentQuestion = preguntas.length - 1;
    mostrarPregunta(currentQuestion);
}

document.getElementById('submit-btn').addEventListener('click', () => {
    const respuestasUsuario = {};
    examData.forEach((_, idx) => {
        const respuestas = document.querySelectorAll(`input[name=pregunta${idx}]`);
        respuestasUsuario[idx] = Array.from(respuestas).filter(input => input.checked).map(input => parseInt(input.value));
    });

    let puntuacion = 0;
    examData.forEach((pregunta, idx) => {
        if (JSON.stringify(respuestasUsuario[idx].sort()) === JSON.stringify(pregunta.respuestasCorrectas.sort())) {
            puntuacion++;
        }
    });

    document.getElementById('puntuacion').textContent = `Tu puntuación es: ${puntuacion}/${examData.length}`;
    const respuestasCorrectasDiv = document.getElementById('respuestas-correctas');
    respuestasCorrectasDiv.innerHTML = '';

    examData.forEach((pregunta, idx) => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>Pregunta ${idx + 1}:</strong> ${pregunta.pregunta}<br><ul>${pregunta.opciones.map((opcion, j) => `<li>${pregunta.respuestasCorrectas.includes(j + 1) ? `<span class="respuesta-correcta">${opcion}</span>` : opcion}</li>`).join('')}</ul><p class="explicacion">${pregunta.explicacion}</p>`;
        respuestasCorrectasDiv.appendChild(div);
    });

    document.getElementById('resultado').style.display = 'block';
});
