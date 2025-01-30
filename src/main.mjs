import '/src/styles/style.scss'
import products from './products'

// Variabel för att hålla reda på det aktuella sorteringsalternativet
let currentSortOption = 'recommended' // Standardvärde

// Hämta referenser till elementen
const sortOptions = document.querySelector('#sortOptions')
const productsListDiv = document.querySelector('#products-list')
const cart = document.querySelector('#cart-summary')
const form = document.getElementById('orderForm')
const resetBtn = document.getElementById('resetBtn')

const cardInvoiceRadios = Array.from(
  document.querySelectorAll('input[name="payment-option"]'),
)
// Hämta elementet som ska uppdateras
const cartCountElement = document.querySelector('#cart-count')

const inputs = [
  document.querySelector('#creditCardNumber'),
  document.querySelector('#creditCardYear'),
  document.querySelector('#creditCardMonth'),
  document.querySelector('#creditCardCvc'),
  document.querySelector('#personalId'),
]
const invoiceOption = document.querySelector('#invoice')
const cardOption = document.querySelector('#card')
const orderBtn = document.querySelector('#orderBtn')

// Default options
let selectedPaymentOption = 'card'

// REGEX
const personalIdRegEx = new RegExp(
  /^(\d{10}|\d{12}|\d{6}-\d{4}|\d{8}-\d{4}|\d{8} \d{4}|\d{6} \d{4})/,
)
const creditCardNumberRegEx = new RegExp(
  /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/, // MasterCard
)

// Lägg till en event listener för sorteringsdropdown
sortOptions.addEventListener('change', (event) => {
  currentSortOption = event.target.value // Uppdatera det aktuella sorteringsalternativet
  updateProductList() // Uppdatera produktlistan baserat på det aktuella alternativet
})

// Funktion för att uppdatera produktlistan baserat på det aktuella sorteringsalternativet
function updateProductList() {
  let filteredProducts = [...products] // Kopiera produkterna

  // Använd den aktuella sorteringen
  switch (currentSortOption) {
    case 'recommended':
      filteredProducts.sort(
        (product1, product2) => product1.originalIndex - product2.originalIndex,
      )
      break
    case 'price':
      filteredProducts.sort(
        (product1, product2) => product1.price - product2.price,
      )
      break
    case 'memory':
      filteredProducts.sort(
        (product1, product2) => product1.memory - product2.memory,
      )
      break
    case 'rating':
      filteredProducts.sort(
        (product1, product2) => product2.rating - product1.rating,
      )
      break
    case '5g':
      filteredProducts = products.filter((product) => product.network === '5g')
      break
    case '6g':
      filteredProducts = products.filter((product) => product.network === '6g')
      break
    default:
      filteredProducts.sort(
        (product1, product2) => product1.originalIndex - product2.originalIndex,
      )
      break
  }

  // Uppdatera produktlistan
  printProductsList(filteredProducts)
}

// Funktion för att skriva ut produkter i HTML
function printProductsList(filteredProducts) {
  productsListDiv.innerHTML = ''

  if (filteredProducts.length === 0) {
    productsListDiv.innerHTML = `<p>Inga produkter hittades för det här filtret.</p>`
    return
  }

  filteredProducts.forEach((product) => {
    productsListDiv.innerHTML += `
      <article class="product">
        <h3>${product.name}</h3>
        <p>${product.price} kr</p>
        <p>Rating: ${getRatingHtml(product.rating)}</p>
        <img class="product-img" src="${product.img.url}" alt="${product.img.alt}">
        <div class="amountContainer">
          <button class="decrease" id="decrease-${product.id}">-</button>
          <input type="number" min="0" value="${product.amount}" id="input-${product.id}">
          <button class="increase" id="increase-${product.id}">+</button>
        </div>
      </article>
    `
  })

  // Lägg till eventlyssnare för knapparna
  const increaseButtons = document.querySelectorAll('button.increase')
  increaseButtons.forEach((button) => {
    button.addEventListener('click', increaseProductCount)
  })

  const decreaseButtons = document.querySelectorAll('button.decrease')
  decreaseButtons.forEach((button) => {
    button.addEventListener('click', decreaseProductCount)
  })

  // Lägg till eventlyssnare för input-fälten
  const inputFields = document.querySelectorAll('input[type="number"]')
  inputFields.forEach((input) => {
    // Uppdatera produkten direkt när användaren ändrar värdet i input
    input.addEventListener('change', handleInput)

    // Hantera Enter-tangenten för att bekräfta antalet
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        updateProductAmount(e)
      }
    })
  })
}

function handleInput(e) {
  const newValue = e.target.value
  if (!/^\d*$/.test(newValue)) {
    e.target.value = newValue.replace(/[^\d]/g, '') // Tillåt endast siffror
  }
}

// Funktion för att uppdatera mängden direkt från inputfältet
function updateProductAmount(e) {
  const productId = Number(e.target.id.replace('input-', ''))
  const product = products.find((product) => product.id === productId)

  if (product) {
    const newAmount = Number(e.target.value)

    // Validera att det nya antalet är giltigt
    if (!isNaN(newAmount) && newAmount >= 0) {
      product.amount = newAmount
    } else {
      // Återställ till tidigare värde om det nya är ogiltigt
      e.target.value = product.amount
    }

    updateProductList() // Uppdatera produktlistan med aktuell sortering
    updateAndPrintCart() // Uppdatera varukorgen
  }
}

// Funktion för att öka mängden av en produkt
function increaseProductCount(e) {
  const productId = Number(e.target.id.replace('increase-', ''))
  const product = products.find((product) => product.id === productId)

  if (product) {
    product.amount += 1
    updateProductList() // Uppdatera produktlistan med aktuell sortering
    updateAndPrintCart() // Uppdatera varukorgen
  }

  const addBTN = document.querySelector(`#increase-${productId}`)
  if (addBTN) {
    addBTN.focus()
  }
}

// Funktion för att minska mängden av en produkt
function decreaseProductCount(e) {
  const productId = Number(e.target.id.replace('decrease-', ''))
  const product = products.find((product) => product.id === productId)

  if (product && product.amount > 0) {
    product.amount -= 1
    updateProductList() // Uppdatera produktlistan med aktuell sortering
    updateAndPrintCart() // Uppdatera varukorgen
  }
}

// Funktion för att generera rating HTML
function getRatingHtml(rating) {
  const fullStars = Math.floor(rating)
  const isHalf = rating % 1 !== 0

  let html = ''
  for (let i = 0; i < fullStars; i++) {
    html += `<span>⭐</span>`
  }
  if (isHalf) {
    html += `<span>✨</span>`
  }
  return html
}

// Funktion för att uppdatera och skriva ut varukorgen
function updateAndPrintCart() {
  const purchasedProducts = products.filter((product) => product.amount > 0)
  const totalPrice = purchasedProducts.reduce(
    (sum, product) => sum + product.price * product.amount,
    0,
  )
  // Räkna ut totalt antal köpta produkter
  const totalItems = purchasedProducts.reduce(
    (sum, product) => sum + product.amount,
    0,
  )

  // Kontrollera om elementet finns
  if (!cartCountElement) {
    console.error('Elementet med id "cart-count" finns inte i DOM.')
    return
  }

  // Uppdatera cart-count
  cartCountElement.textContent = totalItems
  cart.innerHTML = ''

  if (purchasedProducts.length === 0) {
    cart.innerHTML = '<p>Varukorgen är tom.</p>'
    return
  }

  purchasedProducts.forEach((product) => {
    cart.innerHTML += `
      <div class="cart-item">
        <img class="product-img" src="${product.img.url}" alt="${product.img.alt}">
        <p>${product.name}</p>
        <input type="number" min="0" value="${product.amount}" id="edit-amount-${product.id}">
        <span>${product.amount * product.price} kr</span>
        <button class="remove-btn" data-id="${product.id}">Ta bort</button>
      </div><br>
    `
  })

  cart.innerHTML += `
    <p class="totalPrice"><strong>Totalt pris:</strong> ${totalPrice} kr</p>
  `
  // Lägg till eventlyssnare för input-fält och ta bort-knappar
  const amountInputs = document.querySelectorAll(
    '.cart-item input[type="number"]',
  )
  amountInputs.forEach((input) => {
    input.addEventListener('change', handleCartInputChange)
  })

  const removeButtons = document.querySelectorAll('.remove-btn')
  removeButtons.forEach((button) => {
    button.addEventListener('click', handleRemoveProduct)
  })
}

// Funktion för att hantera ändring av antal i varukorgen
function handleCartInputChange(e) {
  const productId = parseInt(e.target.id.replace('edit-amount-', ''), 10)
  const product = products.find((p) => p.id === productId)

  if (product) {
    const newAmount = parseInt(e.target.value, 10)

    if (!isNaN(newAmount) && newAmount >= 0) {
      product.amount = newAmount
    } else {
      e.target.value = product.amount // Återställ till tidigare värde vid ogiltig inmatning
    }

    updateAndPrintCart() // Uppdatera varukorgen
  }
}

// Funktion för att ta bort en produkt från varukorgen
function handleRemoveProduct(e) {
  const productId = parseInt(e.target.dataset.id, 10)
  const product = products.find((p) => p.id === productId)

  if (product) {
    product.amount = 0 // Sätt mängden till 0 för att ta bort produkten
    updateAndPrintCart() // Uppdatera varukorgen
  }
}

// Skriv ut produkter och varukorg vid sidladdning
updateProductList()
updateAndPrintCart()

function resetCart() {
  // Återställ antalet produkter i varukorgen
  products.forEach((product) => (product.amount = 0))

  // Uppdatera varukorgen visuellt
  cartCountElement.textContent = '0'
  cart.innerHTML = '<p>Varukorgen är tom.</p>'
}

// Funktion för att växla mellan betalningsmetoder
function switchPaymentMethod(e) {
  // Växla mellan kort och faktura
  invoiceOption.classList.toggle('hidden')
  cardOption.classList.toggle('hidden')

  // Uppdatera den valda betalningsmetoden
  selectedPaymentOption = e.target.value

  // Kör validering för att se om Beställ-knappen ska vara aktiverad
  activateOrderButton()
}

// Funktion för att validera och formatera månad och år
function formatValidityInput(e) {
  const input = e.target // Identifiera vilket fält som triggat händelsen
  const value = input.value

  if (input === inputs[2]) {
    // Hantera månad
    // Om värdet är mellan 1 och 9 och längden är 1, lägg till en ledande nolla
    if (value.length === 1 && Number(value) >= 1 && Number(value) <= 9) {
      input.value = value.padStart(2, '0')
    }

    // Om värdet är ogiltigt (ej mellan 1 och 12), rensa det
    if (Number(value) > 12 || Number(value) < 1) {
      input.value = ''
      console.warn('Ogiltig månad, ange ett värde mellan 1 och 12.')
    }
  } else if (input === inputs[1]) {
    // Hantera år
    // Kontrollera om år är giltigt (tvåsiffrigt mellan 24 och 29, eller fyra siffror)
    const year = Number(value)
    const currentYear = new Date().getFullYear()
    if (value.length === 4 && year >= currentYear && year <= currentYear + 5) {
      input.value = value.substring(2) // Omvandlar till tvåsiffrigt år
    } else if (value.length !== 2 || isNaN(year)) {
      input.value = ''
      console.warn(
        'Ogiltigt år, ange ett giltigt tvåsiffrigt eller fyrsiffrigt år.',
      )
    }
  }

  // Kontrollera knappen efter uppdatering
  activateOrderButton()
}

// Registrera eventlyssnaren en gång
let isEventListenerAdded = false

// Funktion för att aktivera/inaktivera Beställ-knappen
function activateOrderButton() {
  orderBtn.setAttribute('disabled', '') // Inaktivera knappen som standard

  // Lägg till eventlyssnaren för månad, om det inte redan är gjort
  if (!isEventListenerAdded) {
    inputs[2].addEventListener('focusout', formatValidityInput)
    inputs[1].addEventListener('focusout', formatValidityInput) // År
    isEventListenerAdded = true
  }

  if (selectedPaymentOption === 'invoice') {
    // Validera personnummer
    if (isPersonalIdNumberValid()) {
      console.log('Invoice option valid')
      orderBtn.removeAttribute('disabled') // Aktivera om personnummer är giltigt
    }
  }

  if (selectedPaymentOption === 'card') {
    // Kontrollera kortnummer
    if (!creditCardNumberRegEx.test(inputs[0].value)) {
      console.warn('Ogiltigt kortnummer.')
      return
    }

    // Kontrollera utgångsår
    const year = Number(inputs[1].value)
    const today = new Date()
    const currentYear = Number(String(today.getFullYear()).substring(2)) // De två sista siffrorna i årtalet
    if (year < currentYear || year > currentYear + 4) {
      console.warn('Ogiltigt utgångsår.')
      return
    }

    // Kontrollera månad
    const month = Number(inputs[2].value)
    if (month < 1 || month > 12) {
      console.warn('Ogiltig månad.')
      return
    }

    // Kontrollera CVC
    if (inputs[3].value.length !== 3 || isNaN(Number(inputs[3].value))) {
      console.warn('Ogiltig CVC.')
      return
    }

    // Om alla kortfält är giltiga, aktivera knappen
    orderBtn.removeAttribute('disabled')
  }
}

// Lägg till submit-händelse på formuläret
form.addEventListener('submit', (event) => {
  event.preventDefault() // Förhindra att formuläret skickas till servern

  // Kontrollera att knappen är aktiverad (alla valideringskrav uppfyllda)
  if (!orderBtn.disabled) {
    alert(
      'Your order has been confirmed. Your package will be delivered in 1-2 workingdays',
    )
  }
})

// Funktion för att kontrollera om personnummer är giltigt
function isPersonalIdNumberValid() {
  return personalIdRegEx.test(inputs[4].value) // Returnerar true om giltigt
}

// Lägg till eventlyssnare
inputs.forEach((input) => {
  input.addEventListener('focusout', activateOrderButton)
  input.addEventListener('change', activateOrderButton)
})
cardInvoiceRadios.forEach((radio) => {
  radio.addEventListener('change', switchPaymentMethod)
})

// Skriv ut produkter och varukorg vid sidladdning
updateProductList()
updateAndPrintCart()

// Återställ formulär
resetBtn.addEventListener('click', () => {
  form.reset()
  // Töm varukorgen
  resetCart()
  document.getElementById('cart-summary').textContent = 'The cart is empty'
  orderBtn.disabled = true
})

// Hämta knappen och lägg till en 'click' event listener
document.getElementById('toggleButton').addEventListener('click', toggleTheme)

// Definiera funktionen som togglar 'light-mode'-klassen
function toggleTheme() {
  // Toggla temat
  document.body.classList.toggle('light-mode') // Lägg till/ta bort klassen 'light-mode'

  // Kontrollera vilken ikon som visas och uppdatera den
  if (toggleButton.textContent === '🌞') {
    toggleButton.textContent = '🌙' // Ändra till mån-ikon
  } else {
    toggleButton.textContent = '🌞' // Ändra till sol-ikon
  }
}

function viewCartSum() {
  const cartCount = parseInt(
    document.getElementById('cart-count').textContent,
    10,
  ) // Hämtar antal varor i varukorgen
  const cartSection = document.querySelector('.cart') // Selektorn för cart-sektionen

  if (cartCount > 0) {
    // Kontrollera om det finns varor
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' }) // Skrolla till varukorgen
  } else {
    alert('The cart is empty')
  }
}

// Add an event listener for mouse click
document.querySelector('.cart-icon').addEventListener('click', viewCartSum)
// Add an event listener for keyboard keydown and trigger viewCartSum when Enter is pressed
document.querySelector('.cart-icon').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    viewCartSum()
  }
})
