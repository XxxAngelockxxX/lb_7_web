const list = document.getElementById('todo-list')
const itemCountSpan = document.getElementById('item-count')
const uncheckedCountSpan = document.getElementById('unchecked-count')
const loadingDiv = document.getElementById('loading')
const errorDiv = document.getElementById('error')

let todos = []
const FIREBASE_URL = 'https://lab-7-36f3b-default-rtdb.europe-west1.firebasedatabase.app/todos'
let animationStates = {}

function setLoading(isLoading) {
  if (loadingDiv) loadingDiv.style.display = isLoading ? 'block' : 'none'
}
function setError(message) {
  if (errorDiv) {
    errorDiv.textContent = message || ''
    errorDiv.style.display = message ? 'block' : 'none'
  }
}

async function loadTodos() {
  setLoading(true)
  setError('')
  try {
    const res = await fetch(`${FIREBASE_URL}.json`)
    if (!res.ok) throw new Error('Помилка завантаження даних')
    const data = await res.json()
    todos = []
    if (data) {
      for (const [id, todo] of Object.entries(data)) {
        todos.push({ ...todo, id })
      }
    }
    render()
    updateCounter()
  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
  }
}

window.onload = function () {
  loadTodos()
}

async function newTodo() {
  const text = prompt('Введіть нову справу:')
  if (text) {
    setLoading(true)
    setError('')
    const todo = {
      text,
      checked: false
    }
    try {
      const res = await fetch(`${FIREBASE_URL}.json`, {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Помилка додавання')
      const data = await res.json()
      if (data && data.name) {
        animationStates[data.name] = 'new'
        await loadTodos()
        setTimeout(() => {
          delete animationStates[data.name]
          render()
        }, 2000)
      } else {
        await loadTodos()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
}

async function updateTodo(id) {
  const todo = todos.find(t => t.id === id)
  if (!todo) return
  const newText = prompt('Відредагуйте справу:', todo.text)
  if (newText && newText !== todo.text) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${FIREBASE_URL}/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ text: newText }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Помилка оновлення')
      await loadTodos()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
}

async function deleteTodo(id) {
  setLoading(true)
  setError('')
  try {
    animationStates[id] = 'delete'
    render()
    setTimeout(async () => {
      const res = await fetch(`${FIREBASE_URL}/${id}.json`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Помилка видалення')
        delete animationStates[id]
        render()
        setLoading(false)
        return
      }
      delete animationStates[id]
      await loadTodos()
      setLoading(false)
    }, 1200)
  } catch (e) {
    setError(e.message)
    setLoading(false)
  }
}

function renderTodo(todo) {
  let bg = ''
  if (animationStates[todo.id] === 'new') {
    bg = 'background-color:#3b82f6;color:white;' // холодно-синій
  } else if (animationStates[todo.id] === 'delete') {
    bg = 'background-color:#ef4444;color:white;' // червоний
  } else if (todo.checked) {
    bg = 'background-color:#a7ffb0;color:#222;' // салатовий
  }
  return `
    <li class="list-group-item" style="${bg}; transition: background-color 0.5s;">
      <input type="checkbox" class="form-check-input me-2" id="${todo.id}" ${todo.checked ? 'checked' : ''} onChange="checkTodo('${todo.id}')"/>
      <label for="${todo.id}" ondblclick="updateTodo('${todo.id}')">
        <span class="${todo.checked ? 'text-success text-decoration-line-through' : ''}">${todo.text}</span>
      </label>
      <button class="btn btn-danger btn-sm float-end" onClick="deleteTodo('${todo.id}')">delete</button>
    </li>
  `
}

function render() {
  list.innerHTML = todos.map(renderTodo).join('')
}

function updateCounter() {
  itemCountSpan.textContent = todos.length
  uncheckedCountSpan.textContent = todos.filter(todo => !todo.checked).length
}

async function checkTodo(id) {
  const todo = todos.find(t => t.id === id)
  if (todo) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${FIREBASE_URL}/${id}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ checked: !todo.checked }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Помилка оновлення')
      await loadTodos()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
}
