const form = document.querySelector('form')
const saveBtn = document.querySelectorAll('button')[2]
const loadBtn = document.querySelectorAll('button')[3]
const bmepDisplay = document.querySelector(".bmep")
const fuelDisplay = document.querySelector('.fuel')
const rpmDisplay = document.querySelector(".rpm")
const diasDisplay = document.querySelector(".dias")
const timeDisplay = document.querySelector(".time")
const tasDisplay = document.querySelector(".tas")
const errorDisplay = document.querySelector('.error')

window.addEventListener("load", () => torqueFetch())
form.addEventListener("submit", e => validate(e))
form.addEventListener("reset", () => reset())
saveBtn.addEventListener("click", () => saveData())
loadBtn.addEventListener("click", () => loadData())

let torqueData = {}
function torqueFetch(){
	fetch("torque.json")
		.then(res => res.json())
		.then(result => {
			torqueData = result
		})
		.catch(() => {
			setError("Error al cargar datos.<br/>Vuelva más tarde.")
			torqueData = false
		})
}

function saveData(){
	const [_, bmep, fuel, rpm, dias, time, tas] = document.querySelectorAll('p')

	const bmepValue = bmep.innerText
	const fuelValue = fuel.innerText
	const rpmValue = rpm.innerText
	const diasValue = dias.innerText
	const tasValue = tas.innerText
	const timeValue = time.innerText

	data = { bmepValue, fuelValue, rpmValue, diasValue, tasValue, timeValue }

	if(bmepValue === '0' || fuelValue === '0' || rpmValue === '0' || diasValue === '0' || tasValue === '0'){
		setError("¡No hay datos que guardar!")
	}else{
		window.localStorage.setItem("dc6Save", JSON.stringify(data))
		setSuccess("¡Datos guardados!")
	}
}

function loadData(){
	const data = JSON.parse(window.localStorage.getItem("dc6Save")) || false
	if(data){
		const { bmepValue, fuelValue, rpmValue, diasValue, tasValue, timeValue } = data
		setSuccess("¡Datos cargados!")
		bmepDisplay.innerHTML = bmepValue
		fuelDisplay.innerHTML = fuelValue
		rpmDisplay.innerHTML = rpmValue
		diasDisplay.innerHTML = diasValue
		tasDisplay.innerHTML = tasValue
		timeDisplay.innerHTML = timeValue
	}else{
		setError("¡No hay datos que cargar!")
	}
}

function validate(e){
	e.preventDefault()
	const fields = Object.fromEntries(new FormData(e.target))
	const torque = fields.torque
	const distancia = Number(fields.distancia)
	const altura = Number(fields.altura)
	const peso = Number(fields.peso)
	const alternativo = Number(fields.alternativo)
	const reserva = Number(fields.reserva)

	if(!torqueData) return

	if(!distancia){
		return setError("La distancia no debe estar vacía.")
	}
	if(distancia <= 10){
		return setError("La distancia es poca.<br/>Mejor ve andando.")
	}
	if(peso < 67_500){
		return setError("El peso es demasiado bajo.")
	}
	if(peso > 97_200){
		return setError("El peso es demasiado alto.")
	}
	if(
		altura > 14 && torque === "th1240" ||
		altura > 20 && torque === "th1200" ||
		altura > 21 && torque === "th1100"
		){
		return setError("Demasiada altura para el BHP seleccionado.")
	}

	const fuelValue = calcFuel(torque, distancia, altura, peso, alternativo, reserva)

	const [rpmValue, bmepValue ] = getRpmBmep(torque, altura)

	const { dias: diasValue, tas: tasValue } = getSpeed(torque, altura, peso)

	const time = getTime(torque, distancia, altura, peso)

	const results = { rpmValue, fuelValue, bmepValue, diasValue, tasValue, time}

	setResult(results)
}

function calcFuel(torque, distancia, altura, peso, alternativo, reserva){
	const winds = 0.25
	const reserve = reserva
	const { tas } = getSpeed(torque, altura, peso)
	const fuelRatio = getFuel(torque, altura)

	const result = ((distancia / tas) + winds + reserve + (alternativo / 180)) * fuelRatio

	return Math.trunc(result)
}

function getSpeed(torque, altura, peso){
	const altitud = "altura" + altura

	if(peso >= 67_500 && peso <= 72_500){
		return {
			dias: torqueData[torque][altitud].peso0.dias,
			tas: torqueData[torque][altitud].peso0.tas,
		}
	}
	else if(peso >= 72_500 && peso <= 77_500){
		return {
			dias: torqueData[torque][altitud].peso1.dias,
			tas: torqueData[torque][altitud].peso1.tas,
		}
	}
	else if(peso >= 77_500 && peso <= 82_500){
		return {
			dias: torqueData[torque][altitud].peso2.dias,
			tas: torqueData[torque][altitud].peso2.tas,
		}
	}
	else if(peso >= 82_500 && peso <= 87_500){
		return {
			dias: torqueData[torque][altitud].peso3.dias,
			tas: torqueData[torque][altitud].peso3.tas,
		}
	}
	else if(peso >= 87_500 && peso <= 92_500){
		return {
			dias: torqueData[torque][altitud].peso4.dias,
			tas: torqueData[torque][altitud].peso4.tas,
		}
	}
	else if(peso >= 92_500 && peso <= 97_500){
		return {
			dias: torqueData[torque][altitud].peso5.dias,
			tas: torqueData[torque][altitud].peso5.tas,
		}
	}
	else{
		return { dias: 0, tas: 0}
	}
}

function getFuel(torque, altura){
	const altitud = "altura" + altura
	return torqueData[torque][altitud].lbhr * 4
}

function getRpmBmep(torque, altura){
	const altitud = "altura" + altura
	const rpmBmepValues = [
		torqueData[torque][altitud].rpm,
		torqueData[torque][altitud].bmep
	]
	return rpmBmepValues
}

function getTime(torque, distancia, altura, peso){
	const { tas } = getSpeed(torque, altura, peso)
	const timeArray = (distancia / tas).toFixed(3).split(".")
	const hours = Number(timeArray[0])
	const minutes = Number((timeArray[1] * 60).toString().substring(0, 2))

	return results = { hours , minutes }
}

function setResult(results){
	const { bmepValue, fuelValue, rpmValue, diasValue, tasValue, time: { hours, minutes } } = results
	rpmDisplay.innerHTML = rpmValue
	fuelDisplay.innerHTML = fuelValue
	bmepDisplay.innerHTML = bmepValue
	diasDisplay.innerHTML = diasValue
	tasDisplay.innerHTML = tasValue
	timeDisplay.innerHTML = `${hours}h:${minutes}m`
	setSuccess("¡Listo!")
}

function reset(){
	setError("")
	setSuccess("")
	bmepDisplay.innerHTML = "0"
	fuelDisplay.innerHTML = "0"
	rpmDisplay.innerHTML = "0"
	diasDisplay.innerHTML = "0"
	tasDisplay.innerHTML = "0"
	timeDisplay.innerHTML = "00h:00m"
}

function setSuccess(message){

	if(message){
		setError("")
		errorDisplay.innerHTML = message
		errorDisplay.classList.add('success')
	}else{
		errorDisplay.innerHTML = ""
		errorDisplay.classList.remove('success')
	}

}

function setError(error){

	if(error){
		setSuccess("")
		errorDisplay.innerHTML = error
		errorDisplay.classList.add('active')
	}else{
		errorDisplay.innerHTML = ""
		errorDisplay.classList.remove('active')
	}

}
