import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { getErrorMessage, http } from '../../../shared/api/http'
import type { RecordData } from '../types'

export function useModuleForm(resource: string, onSuccess: () => void, defaultValues: RecordData = {}) {
  const [editing, setEditing] = useState<RecordData | null>(null)
  const [form, setForm] = useState<RecordData>(defaultValues)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function startCreate() {
    setEditing(null)
    setForm(defaultValues)
    setMessage('')
    setError('')
  }

  function startEdit(record: RecordData) {
    setEditing(record)
    setForm(record)
    setMessage('')
    setError('')
  }

  const setField = useCallback((name: string, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    const payload = normalizePayload(form)
    try {
      if (editing?.id) {
        await http.put(`/${resource}/${editing.id}`, payload)
        setMessage('Record updated')
      } else {
        await http.post(`/${resource}`, payload)
        setMessage('Record created')
      }
      setForm({})
      setEditing(null)
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleDelete(id: unknown) {
    if (!id) return
    setMessage('')
    setError('')
    try {
      await http.delete(`/${resource}/${id}`)
      setMessage('Record deleted')
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return {
    editing,
    form,
    message,
    error,
    startCreate,
    startEdit,
    setField,
    handleSubmit,
    handleDelete,
  }
}

export function normalizePayload(form: RecordData) {
  return form as RecordData
}
