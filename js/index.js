let myChart; // Variable para almacenar la instancia del gráfico

function processData(data, startDate, endDate, startTime, endTime, includeWeekends) {
  // Función para determinar si una fecha está dentro del rango horario
  function isWithinHours(date, startTime, endTime) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours >= startTime && hours < endTime || (hours === endTime && minutes === 0);
  }

  // Función para determinar si una fecha es fin de semana
  function isWeekend(date) {
    const day = date.getDay();
    return day === 6 || day === 0; // Sábado (6) o Domingo (0)
  }

  // Filtrar los registros dentro del rango de fechas y horas, y excluyendo fines de semana si es necesario
  const filteredData = data.filter(record => {
    const startTimeRecord = new Date(record['Start time']);
    const endTimeRecord = new Date(record['End time']);
    return startTimeRecord >= startDate && endTimeRecord <= endDate &&
      isWithinHours(startTimeRecord, startTime, endTime) &&
      isWithinHours(endTimeRecord, startTime, endTime) &&
      (includeWeekends || !isWeekend(startTimeRecord));
  });
  console.log(filteredData)
  // Calcular el tiempo total para cada entorno y estado
  const environmentStats = {};

  filteredData.forEach(rec => {
    const record = Object.keys(rec);
    for (let i = 2; i < record.length; i++) {
      const environment = record[i];
      const startTimeRecord = new Date(rec['Start time']);
      const endTimeRecord = new Date(rec['End time']);
      const duration = endTimeRecord - startTimeRecord;
      // Asegurarse de que la duración sea positiva (evitar errores de cálculo)
      if (duration > 0) {
        if (!environmentStats[environment]) {
          environmentStats[environment] = {
            OK: 0,
            BAD: 0,
            WARN: 0
          };
        }
        environmentStats[environment][rec[record[i]]] += (duration + 60000) / 1000 / 3600;
      }
    }
  });
  // Crear los datos para el diagrama de tarta
  const chartData = {
    labels: ["OK", "BAD", "WARNING"],
    datasets: []
  };
  for (const environment in environmentStats) {
    const stats = environmentStats[environment];
    chartData.datasets.push({
      label: environment,
      data: [stats.OK, stats.BAD, stats.WARN],
      backgroundColor: ['green', 'red', 'yellow']
    });
  }
  if (myChart) {
    myChart.destroy();
  }
  // Crear el diagrama de tarta usando Chart.js
  const ctx = document.getElementById('myChart').getContext('2d');

 myChart= new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let dataset = context.dataset || '';
              context.formattedValue = context.formattedValue;
              context.formattedValue += " horas"
              const label = dataset.label;
              //const value = dataset.data[context.tooltipItem.index].toFixed(2);   
              // Limit to 2 decimal places
              return label + ': ' + context.formattedValue;
            }
          }
        }
      }
    }
  });
}

const _init = async () => {
  // Obtener los valores de los campos del formulario
  const startDateString = document.getElementById('startDate').value;
  const endDateString = document.getElementById('endDate').value;
  const startTime = parseInt(document.getElementById('startTime').value);
  const endTime = parseInt(document.getElementById('endTime').value);
  const includeWeekends = document.getElementById('includeWeekends').checked;
  console.log(includeWeekends)
  // Validar los datos
  if (!startDateString || !endDateString || isNaN(startTime) || isNaN(endTime)) {
    alert('Por favor, completa todos los campos con datos válidos.');
    return;
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (startDate > endDate) {
    alert('La fecha de inicio debe ser anterior a la fecha de fin.');
    return;
  }

  if (startTime < 0 || startTime > 23 || endTime < 0 || endTime > 23) {
    alert('Las horas deben estar entre 0 y 23.');
    return;
  }
  // Ejemplo de uso
  const data = await fetchDataAndCreateChart();
  /* const startDate = new Date('2024-09-16');
  const endDate = new Date('2024-09-17');
  const startTime = 8; // 8:00 AM
  const endTime = 14; // 5:00 PM
  c onst includeWeekends = false; // Por defecto, no incluir fines de semana*/
  processData(data, startDate, endDate, startTime, endTime, includeWeekends);
}
async function fetchDataAndCreateChart() {
  // Realizar la petición GET al archivo CSV
  const response = await fetch('https://raw.githubusercontent.com/pacoDevelop/monitor/main/log.csv');
  const csvData = await response.text();

  // Convertir el CSV a un formato más manejable (array de objetos)
  const data = parseCSV(csvData); // Implementa la función parseCSV
  return data;

}

// Función para parsear el CSV a un array de objetos
function parseCSV(csvData) {
  return Papa.parse(csvData, {
    header: true, // Si el CSV tiene encabezados
    dynamicTyping: true // Convertir valores numéricos automáticamente
  }).data;
}


const form = document.getElementById('data-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Llamar a la función para iniciar el proceso
  _init();
});
