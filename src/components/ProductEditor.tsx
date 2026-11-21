import { Camera, Eye, EyeOff, ImagePlus, Images, Link2, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import type { CatalogApp, EditorImage } from '../hooks/useCatalogApp';
import { formatMoney, parsePrice } from '../lib/format';
import { formatBytes } from '../lib/image';
import { Alert, Button, Field, Sheet, TextArea, TextInput, cx } from './ui';

const imagePreview = (image: EditorImage) => (image.kind === 'new' ? image.previewUrl : image.kind === 'none' ? '' : image.url);

function ImagePicker({ app }: { app: CatalogApp }) {
  const { editor, selectEditorImage, setEditorImageUrl, removeEditorImage } = app;
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(editor.image.kind === 'url');
  const preview = imagePreview(editor.image);

  const onFiles = (files: FileList | null) => {
    void selectEditorImage(files?.[0]);
    // Permite volver a elegir la misma foto después de quitarla.
    if (galleryInput.current) galleryInput.current.value = '';
    if (cameraInput.current) cameraInput.current.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">Foto del producto</span>

      {/* accept="image/*" sin capture abre la fototeca del celular (iOS: Fototeca / Tomar foto / Archivos). */}
      <input ref={galleryInput} className="sr-only" type="file" accept="image/*" onChange={(event) => onFiles(event.target.files)} tabIndex={-1} aria-hidden />
      {/* capture="environment" abre directamente la cámara trasera. */}
      <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => onFiles(event.target.files)} tabIndex={-1} aria-hidden />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={(event) => {
          const file = [...event.clipboardData.files].find((item) => item.type.startsWith('image/'));
          if (file) void selectEditorImage(file);
        }}
        className={cx(
          'relative overflow-hidden rounded-2xl border-2 border-dashed transition',
          dragging ? 'border-brand-500 bg-brand-50' : preview ? 'border-transparent' : 'border-ink-200 bg-ink-50',
        )}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Vista previa del producto" className="aspect-[4/3] w-full rounded-2xl bg-ink-100 object-cover" />
            {editor.processingImage && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            )}
            <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => galleryInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-ink-900 shadow-sm backdrop-blur hover:bg-white">
                <RefreshCw className="h-3.5 w-3.5" /> Cambiar
              </button>
              <button type="button" onClick={removeEditorImage} className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm backdrop-blur hover:bg-white">
                <Trash2 className="h-3.5 w-3.5" /> Quitar
              </button>
            </div>
            {editor.image.kind === 'new' && (
              <span className="absolute left-2 top-2 rounded-lg bg-ink-900/80 px-2 py-1 text-[11px] font-medium text-white">
                Optimizada: {formatBytes(editor.image.originalBytes)} → {formatBytes(editor.image.file.size)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center px-4 py-6 text-center">
            {editor.processingImage ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
                <p className="mt-2 text-sm font-medium text-ink-700">Optimizando foto…</p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-900">Añade una foto</p>
                <p className="mt-0.5 text-xs text-ink-500">Desde la galería de tu celular o la cámara. La optimizamos automáticamente.</p>
                <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-2">
                  <Button type="button" variant="primary" onClick={() => galleryInput.current?.click()}>
                    <Images className="h-4 w-4" /> Galería
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => cameraInput.current?.click()}>
                    <Camera className="h-4 w-4" /> Cámara
                  </Button>
                </div>
                <p className="mt-3 hidden text-xs text-ink-400 sm:block">o arrastra una imagen aquí</p>
              </>
            )}
          </div>
        )}
      </div>

      {showUrl ? (
        <TextInput
          type="url"
          inputMode="url"
          className="mt-2 text-xs"
          placeholder="https://… enlace de una imagen"
          value={editor.image.kind === 'url' ? editor.image.url : ''}
          onChange={(event) => setEditorImageUrl(event.target.value)}
        />
      ) : (
        <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900" onClick={() => setShowUrl(true)}>
          <Link2 className="h-3.5 w-3.5" /> Usar un enlace de imagen
        </button>
      )}
    </div>
  );
}

export function ProductEditor({ app, categories }: { app: CatalogApp; categories: string[] }) {
  const { editor, closeEditor, setEditorField, saveProduct } = app;
  const listId = useId();
  const isEditing = Boolean(editor.productId);
  const price = parsePrice(editor.form.price);
  const busy = editor.saving || editor.processingImage;

  return (
    <Sheet
      open={editor.open}
      onClose={closeEditor}
      eyebrow={isEditing ? 'Editar producto' : 'Nuevo producto'}
      title={isEditing ? editor.form.name || 'Producto' : 'Añadir al catálogo'}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="ghost" onClick={closeEditor} disabled={editor.saving}>
            Cancelar
          </Button>
          {!isEditing && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void saveProduct(undefined, { addAnother: true })}>
              Guardar y añadir otro
            </Button>
          )}
          <Button type="submit" form="product-editor-form" loading={editor.saving} disabled={busy}>
            {isEditing ? 'Guardar cambios' : 'Publicar producto'}
          </Button>
        </div>
      }
    >
      <form id="product-editor-form" className="space-y-4" onSubmit={(event) => void saveProduct(event)} noValidate>
        <ImagePicker key={editor.productId ?? 'new'} app={app} />

        <Field label="Nombre del producto">
          <TextInput
            required
            maxLength={120}
            value={editor.form.name}
            onChange={(event) => setEditorField('name', event.target.value)}
            placeholder="Ej. Pan de jamón"
            autoComplete="off"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (USD)" hint={Number.isFinite(price) && price > 0 ? formatMoney(price) : 'Usa coma o punto'}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">$</span>
              <TextInput
                required
                inputMode="decimal"
                className="pl-7"
                value={editor.form.price}
                onChange={(event) => setEditorField('price', event.target.value)}
                placeholder="0,00"
              />
            </div>
          </Field>
          <Field label="Categoría">
            <TextInput
              required
              maxLength={60}
              list={listId}
              value={editor.form.category}
              onChange={(event) => setEditorField('category', event.target.value)}
              placeholder="Ej. Bebidas"
              autoComplete="off"
            />
            <datalist id={listId}>
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
        </div>

        {categories.length > 0 && (
          <div className="-mt-1 flex flex-wrap gap-1.5">
            {categories.slice(0, 10).map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setEditorField('category', category)}
                className={cx(
                  'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                  editor.form.category === category ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <Field label="Descripción" optional>
          <TextArea
            rows={3}
            maxLength={500}
            value={editor.form.description}
            onChange={(event) => setEditorField('description', event.target.value)}
            placeholder="Ingredientes, tamaño, presentación…"
          />
        </Field>

        <button
          type="button"
          onClick={() => setEditorField('active', !editor.form.active)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-200 px-4 py-3 text-left"
          aria-pressed={editor.form.active}
        >
          <span className="flex items-center gap-3">
            {editor.form.active ? <Eye className="h-5 w-5 text-brand-600" /> : <EyeOff className="h-5 w-5 text-ink-400" />}
            <span>
              <span className="block text-sm font-semibold text-ink-900">{editor.form.active ? 'Visible en la tienda' : 'Oculto'}</span>
              <span className="block text-xs text-ink-500">{editor.form.active ? 'Los clientes lo pueden pedir.' : 'Guárdalo como borrador y publícalo luego.'}</span>
            </span>
          </span>
          <span className={cx('relative h-6 w-11 rounded-full transition', editor.form.active ? 'bg-brand-600' : 'bg-ink-200')}>
            <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', editor.form.active ? 'left-[22px]' : 'left-0.5')} />
          </span>
        </button>

        {editor.error && <Alert>{editor.error}</Alert>}
      </form>
    </Sheet>
  );
}
