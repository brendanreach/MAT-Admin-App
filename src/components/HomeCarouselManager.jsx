import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  AUDIENCE_OPTIONS,
  AUTO_SLIDE_DESCRIPTIONS,
  AUTO_SLIDE_LABELS,
  SLIDE_TARGETS,
  compressCarouselImage,
  formatDate,
  getSlideImage,
  getTodayString,
  isSlideScheduledNow,
  removeCarouselImage,
  uploadCarouselImage,
} from '../lib/homeCarousel.js'
import { CarouselSlideView } from './HomeCarousel.jsx'
import './HomeCarouselManager.css'

const EMPTY_FORM = {
  slide_type: 'custom',
  kicker: '',
  title: '',
  body: '',
  button_label: '',
  button_target: '',
  alt_text: '',
  audience: 'everyone',
  starts_on: '',
  ends_on: '',
  is_active: true,
}

const AUTO_PREVIEW_TEXT = {
  next_tournament: { kicker: 'Upcoming Tournament', title: 'Next tournament name', body: 'Tournament location', meta: 'Tournament dates' },
  latest_discussion: { kicker: 'Team Discussion', title: 'Latest discussion title', body: 'The start of the discussion appears here.', meta: 'Comment count' },
  welcome: { kicker: 'Competition Team', title: 'Welcome, [Name]', body: 'A short welcome message.', meta: '' },
}

function getAudienceLabel(value) {
  return AUDIENCE_OPTIONS.find((option) => option.value === value)?.label || 'Everyone'
}

function getScheduleLabel(row) {
  if (row.starts_on && row.ends_on) return `${formatDate(row.starts_on)} – ${formatDate(row.ends_on)}`
  if (row.starts_on) return `From ${formatDate(row.starts_on)}`
  if (row.ends_on) return `Until ${formatDate(row.ends_on)}`
  return ''
}

function getRowTitle(row) {
  if (row.slide_type !== 'custom') return AUTO_SLIDE_LABELS[row.slide_type]
  return row.title || 'Untitled slide'
}

function SlideEditor({ editing, onCancel, onSaved, nextSortOrder }) {
  const isNew = !editing.id
  const isAuto = editing.slide_type !== 'custom'
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...Object.fromEntries(Object.entries(editing).map(([key, value]) => [key, value ?? EMPTY_FORM[key] ?? value])),
  }))
  const [newImage, setNewImage] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (newImage?.previewUrl) URL.revokeObjectURL(newImage.previewUrl)
    }
  }, [newImage])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setProcessing(true)
    try {
      const { blob, width, height } = await compressCarouselImage(file)
      setNewImage({ blob, width, height, previewUrl: URL.createObjectURL(blob) })
      setRemoveImage(false)
    } catch (imageError) {
      setError(imageError.message)
    } finally {
      setProcessing(false)
    }
  }

  const previewImage = newImage?.previewUrl || getSlideImage({
    slide_type: form.slide_type,
    image_url: removeImage ? '' : editing.image_url,
  })

  const previewSlide = isAuto
    ? { ...AUTO_PREVIEW_TEXT[form.slide_type], image: previewImage, alt: form.alt_text }
    : {
        image: previewImage,
        alt: form.alt_text,
        kicker: form.kicker,
        title: form.title || 'Slide title',
        body: form.body,
        meta: '',
        action: form.button_target ? form.button_label : '',
        target: form.button_target,
      }

  async function handleSave(event) {
    event.preventDefault()
    setError('')

    if (!isAuto && !form.title.trim()) {
      setError('Please add a title.')
      return
    }
    if (!isAuto && form.button_target && !form.button_label.trim()) {
      setError('Please add button text, or set the button to "No button".')
      return
    }
    if (form.starts_on && form.ends_on && form.ends_on < form.starts_on) {
      setError('The end date must be on or after the start date.')
      return
    }

    setSaving(true)

    let imagePath = removeImage ? null : editing.image_path || null
    let uploadedPath = null

    try {
      if (newImage) {
        uploadedPath = await uploadCarouselImage(newImage.blob)
        imagePath = uploadedPath
      }
    } catch (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`)
      setSaving(false)
      return
    }

    const payload = {
      image_path: imagePath,
      alt_text: form.alt_text.trim() || null,
      audience: form.audience,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
      is_active: form.is_active,
      ...(isAuto
        ? {}
        : {
            kicker: form.kicker.trim() || null,
            title: form.title.trim(),
            body: form.body.trim() || null,
            button_label: form.button_target ? form.button_label.trim() : null,
            button_target: form.button_target || null,
          }),
    }

    const query = isNew
      ? supabase.from('home_carousel_slides').insert({ ...payload, slide_type: 'custom', sort_order: nextSortOrder })
      : supabase.from('home_carousel_slides').update(payload).eq('id', editing.id)

    const { error: saveError } = await query

    if (saveError) {
      if (uploadedPath) await removeCarouselImage(uploadedPath)
      setError(saveError.message)
      setSaving(false)
      return
    }

    if (editing.image_path && editing.image_path !== imagePath) {
      await removeCarouselImage(editing.image_path)
    }

    setSaving(false)
    onSaved()
  }

  const hasCustomImage = Boolean(newImage || (!removeImage && editing.image_path))

  return (
    <form className="mat-carousel-editor" onSubmit={handleSave}>
      <div className="mat-new-home-hero mat-carousel-editor-preview" aria-label="Slide preview">
        <CarouselSlideView slide={previewSlide} />
        <span className="mat-carousel-editor-preview-tag"><Eye size={14} /> Preview</span>
      </div>

      {isAuto && (
        <p className="mat-carousel-editor-note">
          <Sparkles size={16} />
          <span>
            <strong>{AUTO_SLIDE_LABELS[form.slide_type]}</strong> is an automatic slide.{' '}
            {AUTO_SLIDE_DESCRIPTIONS[form.slide_type]} You can change its picture, who sees it and when.
          </span>
        </p>
      )}

      <div className="mat-carousel-editor-image">
        <label className="mat-secondary-button mat-carousel-upload-button">
          <ImagePlus size={17} />
          {processing ? 'Preparing image…' : hasCustomImage ? 'Replace Image' : 'Upload Image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={processing || saving} />
        </label>
        {hasCustomImage && (
          <button
            type="button"
            className="mat-secondary-button"
            onClick={() => {
              setNewImage(null)
              setRemoveImage(true)
            }}
          >
            Use Default Image
          </button>
        )}
        <span className="mat-carousel-editor-hint">
          {newImage
            ? `Resized to ${newImage.width}×${newImage.height}, ${Math.round(newImage.blob.size / 1024)} KB.`
            : 'Wide photos work best. Large photos are shrunk automatically before upload.'}
        </span>
      </div>

      <div className="mat-form-grid">
        {!isAuto && (
          <>
            <div className="mat-form-group">
              <label htmlFor="carousel-kicker">Small heading</label>
              <input id="carousel-kicker" className="mat-input" maxLength={40} value={form.kicker} onChange={(event) => update('kicker', event.target.value)} placeholder="e.g. Team News" />
            </div>
            <div className="mat-form-group">
              <label htmlFor="carousel-title">Title</label>
              <input id="carousel-title" className="mat-input" maxLength={80} value={form.title} onChange={(event) => update('title', event.target.value)} required />
            </div>
            <div className="mat-form-group mat-carousel-editor-wide">
              <label htmlFor="carousel-body">Description</label>
              <textarea id="carousel-body" className="mat-input" rows={3} maxLength={220} value={form.body} onChange={(event) => update('body', event.target.value)} />
            </div>
            <div className="mat-form-group">
              <label htmlFor="carousel-target">Button opens</label>
              <select id="carousel-target" className="mat-input" value={form.button_target} onChange={(event) => update('button_target', event.target.value)}>
                <option value="">No button</option>
                {SLIDE_TARGETS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="mat-form-group">
              <label htmlFor="carousel-button-label">Button text</label>
              <input id="carousel-button-label" className="mat-input" maxLength={30} value={form.button_label} onChange={(event) => update('button_label', event.target.value)} disabled={!form.button_target} placeholder="e.g. View Calendar" />
            </div>
          </>
        )}

        <div className="mat-form-group mat-carousel-editor-wide">
          <label htmlFor="carousel-alt">Image description (for screen readers)</label>
          <input id="carousel-alt" className="mat-input" maxLength={160} value={form.alt_text} onChange={(event) => update('alt_text', event.target.value)} placeholder="e.g. Team members celebrating with medals" />
        </div>
        <div className="mat-form-group">
          <label htmlFor="carousel-audience">Who sees it</label>
          <select id="carousel-audience" className="mat-input" value={form.audience} onChange={(event) => update('audience', event.target.value)}>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="mat-form-group">
          <label className="mat-carousel-editor-check">
            <input type="checkbox" checked={form.is_active} onChange={(event) => update('is_active', event.target.checked)} />
            Show this slide
          </label>
        </div>
        <div className="mat-form-group">
          <label htmlFor="carousel-start">Show from (optional)</label>
          <input id="carousel-start" type="date" className="mat-input" value={form.starts_on} onChange={(event) => update('starts_on', event.target.value)} />
        </div>
        <div className="mat-form-group">
          <label htmlFor="carousel-end">Show until (optional)</label>
          <input id="carousel-end" type="date" className="mat-input" value={form.ends_on} min={form.starts_on || undefined} onChange={(event) => update('ends_on', event.target.value)} />
        </div>
      </div>

      {error && <div className="mat-carousel-error" role="alert">{error}</div>}

      <div className="mat-carousel-editor-actions">
        <button type="button" className="mat-secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="mat-primary-button" disabled={saving || processing}>
          {saving ? 'Saving…' : isNew ? 'Add Slide' : 'Save Slide'}
        </button>
      </div>
    </form>
  )
}

export default function HomeCarouselManager({ rows, configured, onClose, onChanged }) {
  const [order, setOrder] = useState(rows)
  const [editing, setEditing] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const today = getTodayString()

  useEffect(() => {
    setOrder(rows)
  }, [rows])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [busy, onClose])

  const nextSortOrder = useMemo(
    () => order.reduce((max, row) => Math.max(max, row.sort_order || 0), 0) + 10,
    [order]
  )

  async function saveOrder(nextOrder) {
    setOrder(nextOrder)
    setBusy(true)
    setError('')

    const changes = nextOrder
      .map((row, index) => ({ id: row.id, sort_order: (index + 1) * 10, previous: row.sort_order }))
      .filter((row) => row.sort_order !== row.previous)

    const results = await Promise.all(
      changes.map((row) => supabase.from('home_carousel_slides').update({ sort_order: row.sort_order }).eq('id', row.id))
    )
    const failed = results.find((result) => result.error)
    if (failed) setError(`Could not save the new order: ${failed.error.message}`)

    setBusy(false)
    onChanged()
  }

  function move(index, offset) {
    const target = index + offset
    if (target < 0 || target >= order.length) return
    const nextOrder = [...order]
    const [row] = nextOrder.splice(index, 1)
    nextOrder.splice(target, 0, row)
    saveOrder(nextOrder)
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return
    const nextOrder = [...order]
    const fromIndex = nextOrder.findIndex((row) => row.id === dragId)
    const toIndex = nextOrder.findIndex((row) => row.id === targetId)
    const [row] = nextOrder.splice(fromIndex, 1)
    nextOrder.splice(toIndex, 0, row)
    setDragId(null)
    saveOrder(nextOrder)
  }

  async function toggleActive(row) {
    setBusy(true)
    setError('')
    setOrder((current) => current.map((item) => (item.id === row.id ? { ...item, is_active: !row.is_active } : item)))
    const { error: toggleError } = await supabase
      .from('home_carousel_slides')
      .update({ is_active: !row.is_active })
      .eq('id', row.id)
    if (toggleError) setError(toggleError.message)
    setBusy(false)
    onChanged()
  }

  async function deleteSlide(row) {
    if (!window.confirm(`Delete the slide "${getRowTitle(row)}"? This cannot be undone.`)) return
    setBusy(true)
    setError('')
    const { error: deleteError } = await supabase.from('home_carousel_slides').delete().eq('id', row.id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      await removeCarouselImage(row.image_path)
    }
    setBusy(false)
    onChanged()
  }

  return (
    <div className="mat-modal-backdrop" onClick={() => !busy && onClose()}>
      <div
        className="mat-modal mat-carousel-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="carousel-manager-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mat-modal-header">
          <h2 className="mat-modal-title" id="carousel-manager-title">
            {editing ? (editing.id ? 'Edit Slide' : 'Add Slide') : 'Home Page Slides'}
          </h2>
          <button type="button" className="mat-close-button" aria-label="Close" onClick={onClose} disabled={busy}>
            ×
          </button>
        </div>

        {!configured ? (
          <div className="mat-carousel-manager-body">
            <div className="mat-carousel-error">
              The carousel isn&apos;t set up in the database yet. Run <code>supabase/home-carousel.sql</code> in the
              Supabase SQL editor, then reload this page.
            </div>
          </div>
        ) : editing ? (
          <div className="mat-carousel-manager-body">
            <SlideEditor
              editing={editing}
              nextSortOrder={nextSortOrder}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null)
                onChanged()
              }}
            />
          </div>
        ) : (
          <div className="mat-carousel-manager-body">
            <div className="mat-carousel-manager-intro">
              <p>Drag slides to change their order. Hidden or out-of-date slides don&apos;t appear on the home page.</p>
              <button type="button" className="mat-primary-button" onClick={() => setEditing({ ...EMPTY_FORM })}>
                <Plus size={18} /> Add Slide
              </button>
            </div>

            {error && <div className="mat-carousel-error" role="alert">{error}</div>}

            <ol className="mat-carousel-list">
              {order.map((row, index) => {
                const schedule = getScheduleLabel(row)
                const outOfDate = !isSlideScheduledNow(row, today)
                return (
                  <li
                    key={row.id}
                    className={`mat-carousel-row${row.is_active ? '' : ' hidden'}${dragId === row.id ? ' dragging' : ''}`}
                    draggable={!busy}
                    onDragStart={() => setDragId(row.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(row.id)}
                  >
                    <span className="mat-carousel-row-grip" aria-hidden="true"><GripVertical size={18} /></span>
                    <img src={getSlideImage(row)} alt="" className="mat-carousel-row-thumb" />
                    <div className="mat-carousel-row-copy">
                      <strong>{getRowTitle(row)}</strong>
                      <div className="mat-carousel-row-tags">
                        {row.slide_type !== 'custom' && <span className="auto"><Sparkles size={12} /> Automatic</span>}
                        <span>{getAudienceLabel(row.audience)}</span>
                        {schedule && <span className={outOfDate ? 'warning' : ''}><CalendarRange size={12} /> {schedule}</span>}
                        {!row.is_active && <span className="muted">Hidden</span>}
                      </div>
                    </div>
                    <div className="mat-carousel-row-actions">
                      <button type="button" aria-label="Move up" disabled={busy || index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" aria-label="Move down" disabled={busy || index === order.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={row.is_active ? 'Hide slide' : 'Show slide'}
                        title={row.is_active ? 'Hide slide' : 'Show slide'}
                        disabled={busy}
                        onClick={() => toggleActive(row)}
                      >
                        {row.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button type="button" aria-label="Edit slide" title="Edit slide" disabled={busy} onClick={() => setEditing(row)}>
                        <Pencil size={16} />
                      </button>
                      {row.slide_type === 'custom' && (
                        <button type="button" className="danger" aria-label="Delete slide" title="Delete slide" disabled={busy} onClick={() => deleteSlide(row)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
