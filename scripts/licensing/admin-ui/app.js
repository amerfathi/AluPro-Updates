const state = {
  settings: {
    privateKeyPath: '',
    defaultPlan: 'pro',
    defaultFeatures: []
  },
  featureCatalog: [],
  customers: [],
  licenses: []
}

const el = {
  totalCustomers: document.getElementById('totalCustomers'),
  activeLicenses: document.getElementById('activeLicenses'),
  expiredLicenses: document.getElementById('expiredLicenses'),
  latestIssue: document.getElementById('latestIssue'),
  refreshBtn: document.getElementById('refreshBtn'),
  storePathLabel: document.getElementById('storePathLabel'),
  settingsForm: document.getElementById('settingsForm'),
  privateKeyPath: document.getElementById('privateKeyPath'),
  defaultPlan: document.getElementById('defaultPlan'),
  defaultFeaturesPicker: document.getElementById('defaultFeaturesPicker'),
  customerForm: document.getElementById('customerForm'),
  customerName: document.getElementById('customerName'),
  customerPhone: document.getElementById('customerPhone'),
  customerEmail: document.getElementById('customerEmail'),
  customerNotes: document.getElementById('customerNotes'),
  customersList: document.getElementById('customersList'),
  licenseForm: document.getElementById('licenseForm'),
  licenseCustomerId: document.getElementById('licenseCustomerId'),
  licenseHwid: document.getElementById('licenseHwid'),
  licenseExpiryDate: document.getElementById('licenseExpiryDate'),
  licensePlan: document.getElementById('licensePlan'),
  licenseFeaturesPicker: document.getElementById('licenseFeaturesPicker'),
  licenseNotes: document.getElementById('licenseNotes'),
  generatedTokenBox: document.getElementById('generatedTokenBox'),
  generatedToken: document.getElementById('generatedToken'),
  copyTokenBtn: document.getElementById('copyTokenBtn'),
  licensesTableWrap: document.getElementById('licensesTableWrap'),
  toast: document.getElementById('toast'),
  navButtons: [...document.querySelectorAll('.nav-btn')]
}

const sanitizeFeatures = (features) =>
  Array.isArray(features)
    ? features.map((entry) => String(entry || '').trim().toLowerCase()).filter(Boolean)
    : []

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ar-SA')
}

const showToast = (text, isError = false) => {
  el.toast.textContent = text
  el.toast.style.background = isError ? '#6f1f33' : '#0f2142'
  el.toast.classList.remove('hidden')
  setTimeout(() => el.toast.classList.add('hidden'), 2800)
}

const request = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })
  const payload = await response.json()
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || `HTTP_${response.status}`)
  }
  return payload
}

const setState = (nextState, featureCatalog) => {
  state.settings = nextState.settings || state.settings
  state.customers = nextState.customers || []
  state.licenses = nextState.licenses || []
  if (Array.isArray(featureCatalog)) {
    state.featureCatalog = featureCatalog
  }
  render()
}

const renderCustomerOptions = () => {
  const selectedId = el.licenseCustomerId.value
  el.licenseCustomerId.innerHTML = ''

  if (state.customers.length === 0) {
    const option = document.createElement('option')
    option.value = ''
    option.textContent = 'لا يوجد عملاء'
    el.licenseCustomerId.appendChild(option)
    return
  }

  state.customers.forEach((customer) => {
    const option = document.createElement('option')
    option.value = customer.id
    option.textContent = customer.name
    if (selectedId && selectedId === customer.id) {
      option.selected = true
    }
    el.licenseCustomerId.appendChild(option)
  })
}

const renderFeaturePicker = (element, selectedFeatures, pickerName) => {
  if (!element) return
  const selectedSet = new Set(sanitizeFeatures(selectedFeatures))
  const catalog = state.featureCatalog || []

  element.innerHTML = catalog
    .map(
      (feature) => `
        <label>
          <input type="checkbox" data-picker="${pickerName}" value="${feature.id}" ${
            selectedSet.has(feature.id) ? 'checked' : ''
          } />
          <span class="feature-meta">
            <strong>${feature.label}</strong>
            <span>${feature.description || ''}</span>
          </span>
        </label>
      `
    )
    .join('')
}

const getSelectedFeaturesFromPicker = (pickerName) =>
  [...document.querySelectorAll(`input[data-picker="${pickerName}"]:checked`)]
    .map((checkbox) => String(checkbox.value || '').trim().toLowerCase())
    .filter(Boolean)

const renderCustomersList = () => {
  el.customersList.innerHTML = ''

  if (state.customers.length === 0) {
    const li = document.createElement('li')
    li.innerHTML = '<span class="muted">لا يوجد عملاء بعد.</span>'
    el.customersList.appendChild(li)
    return
  }

  state.customers.forEach((customer) => {
    const licensesCount = state.licenses.filter((x) => x.customerId === customer.id).length
    const li = document.createElement('li')
    li.innerHTML = `
      <strong>${customer.name}</strong>
      <span class="muted">جوال: ${customer.phone || '-'}</span>
      <span class="muted">تراخيص: ${licensesCount}</span>
      <div class="row-actions">
        <button data-action="fill-hwid" data-customer-id="${customer.id}">اختيار للإصدار</button>
        <button class="danger" data-action="delete-customer" data-customer-id="${customer.id}">حذف</button>
      </div>
    `
    el.customersList.appendChild(li)
  })
}

const renderLicensesTable = () => {
  if (state.licenses.length === 0) {
    el.licensesTableWrap.innerHTML = '<p class="muted">لا توجد تراخيص مصدّرة بعد.</p>'
    return
  }

  const rows = [...state.licenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((license) => {
      const statusClass =
        license.status === 'active'
          ? 'status-active'
          : license.status === 'expired'
            ? 'status-expired'
            : 'status-invalid'

      const featureLabels = (license.features || [])
        .map(
          (featureId) =>
            state.featureCatalog.find((feature) => feature.id === featureId)?.label || featureId
        )
        .join(', ')

      return `
        <tr>
          <td>${license.customerName || '-'}</td>
          <td>${license.licenseId}</td>
          <td><code>${license.hwid}</code></td>
          <td>${license.expiryDate}</td>
          <td><span class="status-pill ${statusClass}">${license.status}</span></td>
          <td>${license.plan || '-'}</td>
          <td>${featureLabels || '-'}</td>
          <td>${formatDate(license.createdAt)}</td>
          <td>
            <div class="row-actions">
              <button data-action="copy-token" data-license-id="${license.id}">نسخ الكود</button>
              <button class="danger" data-action="delete-license" data-license-id="${license.id}">حذف</button>
            </div>
          </td>
        </tr>
      `
    })
    .join('')

  el.licensesTableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>العميل</th>
          <th>رقم الترخيص</th>
          <th>HWID</th>
          <th>الانتهاء</th>
          <th>الحالة</th>
          <th>الخطة</th>
          <th>المزايا</th>
          <th>تاريخ الإصدار</th>
          <th>أوامر</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

const renderStats = () => {
  const active = state.licenses.filter((license) => license.status === 'active').length
  const expired = state.licenses.filter((license) => license.status === 'expired').length
  const last = [...state.licenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]

  el.totalCustomers.textContent = String(state.customers.length)
  el.activeLicenses.textContent = String(active)
  el.expiredLicenses.textContent = String(expired)
  el.latestIssue.textContent = last ? formatDate(last.createdAt) : '-'
}

const syncFormsFromState = () => {
  el.privateKeyPath.value = state.settings.privateKeyPath || ''
  el.defaultPlan.value = state.settings.defaultPlan || 'pro'
  if (!el.licensePlan.value) el.licensePlan.value = state.settings.defaultPlan || 'pro'

  renderFeaturePicker(el.defaultFeaturesPicker, state.settings.defaultFeatures, 'settings-default')
  renderFeaturePicker(
    el.licenseFeaturesPicker,
    state.settings.defaultFeatures,
    'license-features'
  )
}

const render = () => {
  renderStats()
  renderCustomerOptions()
  renderCustomersList()
  renderLicensesTable()
  syncFormsFromState()
}

const loadState = async () => {
  const payload = await request('/api/state')
  setState(payload.state, payload.featureCatalog)
  if (payload.storePath) {
    el.storePathLabel.textContent = payload.storePath
  }
  return payload
}

const handleSaveSettings = async (event) => {
  event.preventDefault()
  const payload = {
    privateKeyPath: el.privateKeyPath.value.trim(),
    defaultPlan: el.defaultPlan.value.trim() || 'pro',
    defaultFeatures: getSelectedFeaturesFromPicker('settings-default')
  }

  const response = await request('/api/settings', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  setState(response.state)
  showToast('تم حفظ الإعدادات.')
}

const handleAddCustomer = async (event) => {
  event.preventDefault()
  const payload = {
    name: el.customerName.value.trim(),
    phone: el.customerPhone.value.trim(),
    email: el.customerEmail.value.trim(),
    notes: el.customerNotes.value.trim()
  }

  const response = await request('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  setState(response.state)
  el.customerForm.reset()
  showToast('تمت إضافة العميل.')
}

const handleGenerateLicense = async (event) => {
  event.preventDefault()
  const payload = {
    customerId: el.licenseCustomerId.value,
    hwid: el.licenseHwid.value.trim().toUpperCase(),
    expiryDate: el.licenseExpiryDate.value,
    plan: el.licensePlan.value.trim() || state.settings.defaultPlan,
    features: getSelectedFeaturesFromPicker('license-features'),
    notes: el.licenseNotes.value.trim()
  }

  const response = await request('/api/licenses/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  setState(response.state)
  el.generatedToken.value = response.token
  el.generatedTokenBox.classList.remove('hidden')
  showToast('تم إصدار كود التفعيل.')
}

const copyText = async (text) => {
  await navigator.clipboard.writeText(text)
}

const handleCustomersActions = async (event) => {
  const button = event.target.closest('button')
  if (!button) return

  const action = button.dataset.action
  const customerId = button.dataset.customerId
  if (!customerId) return

  if (action === 'fill-hwid') {
    el.licenseCustomerId.value = customerId
    document.getElementById('licenses').scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  if (action === 'delete-customer') {
    if (!window.confirm('هل تريد حذف هذا العميل؟')) return
    const response = await request(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE'
    })
    setState(response.state)
    showToast('تم حذف العميل.')
  }
}

const handleLicensesActions = async (event) => {
  const button = event.target.closest('button')
  if (!button) return
  const action = button.dataset.action
  const licenseId = button.dataset.licenseId
  if (!licenseId) return

  const license = state.licenses.find((x) => x.id === licenseId)
  if (!license) return

  if (action === 'copy-token') {
    await copyText(license.token)
    showToast('تم نسخ الكود.')
    return
  }

  if (action === 'delete-license') {
    if (!window.confirm('هل تريد حذف هذا الترخيص؟')) return
    const response = await request(`/api/licenses/${encodeURIComponent(licenseId)}`, {
      method: 'DELETE'
    })
    setState(response.state)
    showToast('تم حذف الترخيص.')
  }
}

const setDefaultExpiry = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 12)
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  el.licenseExpiryDate.value = `${yyyy}-${mm}-${dd}`
}

const setupNavigation = () => {
  el.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      el.navButtons.forEach((x) => x.classList.remove('active'))
      button.classList.add('active')
      const target = document.getElementById(button.dataset.scroll)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}

const boot = async () => {
  try {
    await loadState()
    setDefaultExpiry()
  } catch (error) {
    showToast(`فشل تحميل البيانات: ${error.message}`, true)
  }

  setupNavigation()
  el.refreshBtn.addEventListener('click', () =>
    loadState()
      .then(() => showToast('تم التحديث.'))
      .catch((error) => showToast(error.message, true))
  )
  el.settingsForm.addEventListener('submit', (event) =>
    handleSaveSettings(event).catch((error) => showToast(error.message, true))
  )
  el.customerForm.addEventListener('submit', (event) =>
    handleAddCustomer(event).catch((error) => showToast(error.message, true))
  )
  el.licenseForm.addEventListener('submit', (event) =>
    handleGenerateLicense(event).catch((error) => showToast(error.message, true))
  )
  el.customersList.addEventListener('click', (event) =>
    handleCustomersActions(event).catch((error) => showToast(error.message, true))
  )
  el.licensesTableWrap.addEventListener('click', (event) =>
    handleLicensesActions(event).catch((error) => showToast(error.message, true))
  )
  el.copyTokenBtn.addEventListener('click', () => {
    copyText(el.generatedToken.value)
      .then(() => showToast('تم نسخ الكود.'))
      .catch((error) => showToast(error.message, true))
  })
}

boot()
