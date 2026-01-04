const TEXT = {
  title: "\u75c5\u4f8b\u56fe\u7247\u68c0\u7d22",
  categoryLabel: "\u7c7b\u522b",
  diseaseLabel: "\u75c5\u4f8b",
  selectCategory: "\u9009\u62e9\u7c7b\u522b",
  selectDisease: "\u9009\u62e9\u75c5\u4f8b",
  empty: "\u8bf7\u9009\u62e9\u7c7b\u522b\u6216\u75c5\u4f8b\u3002",
  notFound: "\u6ca1\u6709\u627e\u5230\u8be5\u7c7b\u522b\u3002",
  imagesCount: function (count) {
    return "\u5171 " + count + " \u5f20";
  },
};

const categorySelect = document.getElementById("category-select");
const diseaseSelect = document.getElementById("disease-select");
const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const resultsEl = document.getElementById("results");
const categoryLabel = document.getElementById("category-label");
const diseaseLabel = document.getElementById("disease-label");

let categories = [];
let diseaseMap = new Map();

function setText() {
  titleEl.textContent = TEXT.title;
  categoryLabel.textContent = TEXT.categoryLabel;
  diseaseLabel.textContent = TEXT.diseaseLabel;
}

function setMeta(total, categoryCount) {
  metaEl.textContent = TEXT.imagesCount(total) + " - " + categoryCount + " \u7c7b";
}

function makeOption(value, label) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = label;
  return opt;
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function buildCategoryOptions() {
  clearChildren(categorySelect);
  categorySelect.appendChild(makeOption("", TEXT.selectCategory));
  categories.forEach((cat) => {
    categorySelect.appendChild(makeOption(cat.name, cat.name));
  });
}

function buildDiseaseOptions(selectedCategory) {
  clearChildren(diseaseSelect);
  diseaseSelect.appendChild(makeOption("", TEXT.selectDisease));
  if (!selectedCategory) {
    categories.forEach((cat) => {
      const group = document.createElement("optgroup");
      group.label = cat.name;
      cat.diseases.forEach((disease) => {
        group.appendChild(makeOption(disease.name, disease.name));
      });
      diseaseSelect.appendChild(group);
    });
    return;
  }
  const category = categories.find((cat) => cat.name === selectedCategory);
  if (!category) {
    return;
  }
  category.diseases.forEach((disease) => {
    diseaseSelect.appendChild(makeOption(disease.name, disease.name));
  });
}

function makeThumbs(images) {
  const wrap = document.createElement("div");
  wrap.className = "thumbs";
  images.forEach((path) => {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = encodeURI(path);
    wrap.appendChild(img);
  });
  return wrap;
}

function makeCard(title, images) {
  const card = document.createElement("div");
  card.className = "card";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = TEXT.imagesCount(images.length);
  card.appendChild(heading);
  card.appendChild(badge);
  card.appendChild(makeThumbs(images));
  return card;
}

function showEmpty(message) {
  clearChildren(resultsEl);
  const tip = document.createElement("div");
  tip.className = "empty";
  tip.textContent = message;
  resultsEl.appendChild(tip);
}

function showCategory(categoryName) {
  clearChildren(resultsEl);
  const category = categories.find((cat) => cat.name === categoryName);
  if (!category) {
    showEmpty(TEXT.notFound);
    return;
  }
  const grid = document.createElement("div");
  grid.className = "grid result";
  category.diseases.forEach((disease) => {
    grid.appendChild(makeCard(disease.name, disease.images));
  });
  resultsEl.appendChild(grid);
}

function showDisease(diseaseName) {
  clearChildren(resultsEl);
  const info = diseaseMap.get(diseaseName);
  if (!info) {
    showEmpty(TEXT.empty);
    return;
  }
  const grid = document.createElement("div");
  grid.className = "grid result";
  grid.appendChild(makeCard(diseaseName, info.images));
  resultsEl.appendChild(grid);
}

function handleCategoryChange() {
  const categoryName = categorySelect.value;
  diseaseSelect.value = "";
  buildDiseaseOptions(categoryName);
  if (categoryName) {
    showCategory(categoryName);
  } else {
    showEmpty(TEXT.empty);
  }
}

function handleDiseaseChange() {
  const diseaseName = diseaseSelect.value;
  if (!diseaseName) {
    showEmpty(TEXT.empty);
    return;
  }
  const info = diseaseMap.get(diseaseName);
  if (info && categorySelect.value !== info.category) {
    categorySelect.value = info.category;
  }
  showDisease(diseaseName);
}

function indexData(data) {
  categories = data.categories || [];
  diseaseMap = new Map();
  categories.forEach((cat) => {
    cat.diseases.forEach((disease) => {
      diseaseMap.set(disease.name, {
        category: cat.name,
        images: disease.images,
      });
    });
  });
}

function loadData() {
  fetch("data/index.json")
    .then((res) => res.json())
    .then((data) => {
      setText();
      indexData(data);
      buildCategoryOptions();
      buildDiseaseOptions("");
      setMeta(data.total_images || 0, categories.length);
      showEmpty(TEXT.empty);
    })
    .catch(() => {
      showEmpty("Failed to load index.json");
    });
}

categorySelect.addEventListener("change", handleCategoryChange);
diseaseSelect.addEventListener("change", handleDiseaseChange);

loadData();
