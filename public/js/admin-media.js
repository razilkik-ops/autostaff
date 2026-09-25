const adminCsrf = document.querySelector('meta[name="csrf-token"]')?.content || "";

async function uploadAdminPhoto(file) {
  const body = new FormData();
  body.append("photo", file);
  const response = await fetch("/admin/media", { method: "POST", headers: { "x-csrf-token": adminCsrf }, body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Не удалось загрузить фото.");
  return result.url;
}

function validPhotoUrl(value) {
  return value.length <= 500 && (value.startsWith("/") && !value.startsWith("//") || /^https:\/\//i.test(value));
}

const photoEditor = document.querySelector("[data-admin-photo-editor]");
if (photoEditor) {
  const values = photoEditor.querySelector("[data-photo-values]");
  const list = photoEditor.querySelector("[data-photo-list]");
  const message = photoEditor.querySelector("[data-photo-message]");
  const urlInput = photoEditor.querySelector("[data-photo-url]");
  const fileInput = photoEditor.querySelector("[data-photo-upload]");
  let photos = values.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 8);

  function sync() {
    values.value = photos.join("\n");
    list.replaceChildren();
    if (!photos.length) {
      const empty = document.createElement("p");
      empty.className = "admin-photo-empty";
      empty.textContent = "Фотографий пока нет. Загрузите файл или добавьте ссылку.";
      list.append(empty);
      return;
    }
    photos.forEach((url, index) => {
      const row = document.createElement("div");
      row.className = "admin-photo-row";
      const image = document.createElement("img");
      image.src = url;
      image.alt = `Фото ${index + 1}`;
      const description = document.createElement("div");
      const badge = document.createElement("strong");
      badge.textContent = index === 0 ? "Основное фото" : `Фото ${index + 1}`;
      const path = document.createElement("small");
      path.textContent = url;
      description.append(badge, path);
      const controls = document.createElement("div");
      controls.className = "admin-photo-row-actions";
      for (const [label, disabled, action] of [
        ["↑", index === 0, () => { [photos[index - 1], photos[index]] = [photos[index], photos[index - 1]]; sync(); }],
        ["↓", index === photos.length - 1, () => { [photos[index + 1], photos[index]] = [photos[index], photos[index + 1]]; sync(); }],
        ["Удалить", false, () => { photos.splice(index, 1); sync(); }],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.disabled = disabled;
        button.setAttribute("aria-label", `${label} фото ${index + 1}`);
        button.addEventListener("click", action);
        controls.append(button);
      }
      row.append(image, description, controls);
      list.append(row);
    });
  }

  function addPhoto(url) {
    if (!validPhotoUrl(url)) return message.textContent = "Укажите путь от / или ссылку https:// до 500 символов.";
    if (photos.length >= 8) return message.textContent = "В товаре может быть не более 8 фотографий.";
    if (photos.includes(url)) return message.textContent = "Это фото уже добавлено.";
    photos.push(url);
    message.textContent = "Фото добавлено. Сохраните товар, чтобы опубликовать изменения.";
    sync();
  }

  photoEditor.querySelector("[data-photo-add]").addEventListener("click", () => {
    addPhoto(urlInput.value.trim());
    if (photos.includes(urlInput.value.trim())) urlInput.value = "";
  });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (photos.length >= 8) { message.textContent = "В товаре может быть не более 8 фотографий."; fileInput.value = ""; return; }
    fileInput.disabled = true;
    message.textContent = "Загрузка фотографии…";
    try { addPhoto(await uploadAdminPhoto(file)); }
    catch (error) { message.textContent = error.message; }
    finally { fileInput.disabled = false; fileInput.value = ""; }
  });
  photoEditor.closest("form").addEventListener("submit", (event) => {
    if (!photos.length) { event.preventDefault(); message.textContent = "Добавьте хотя бы одно фото товара."; }
  });
  sync();
}

const heroEditor = document.querySelector("[data-admin-hero-editor]");
if (heroEditor) {
  const urlInput = heroEditor.querySelector("[data-hero-url]");
  const preview = heroEditor.querySelector("[data-hero-preview]");
  const fileInput = heroEditor.querySelector("[data-hero-upload]");
  const message = heroEditor.querySelector("[data-hero-message]");
  urlInput.addEventListener("change", () => { if (validPhotoUrl(urlInput.value.trim())) preview.src = urlInput.value.trim(); });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileInput.disabled = true;
    message.textContent = "Загрузка обложки…";
    try {
      urlInput.value = await uploadAdminPhoto(file);
      preview.src = urlInput.value;
      message.textContent = "Обложка загружена. Сохраните материал, чтобы опубликовать изменение.";
    } catch (error) { message.textContent = error.message; }
    finally { fileInput.disabled = false; fileInput.value = ""; }
  });
}
