
"use strict";

// 1. 数据初始化
const STORAGE_KEY = "langxi-nursery-v1.1";

const initialData = {
  trees: [
    {
      id: "tree-1",
      name: "香樟",
      spec: "胸径约20厘米",
      quantity: null,
      note: "数百棵，具体数量待盘点"
    },
    {
      id: "tree-2",
      name: "樱花",
      spec: "直径约7—10厘米",
      quantity: null,
      note: "100余棵，规格口径待确认"
    }
  ],
  customers: [
    {
      id: "demo-1",
      name: "演示·常州园林工程公司",
      region: "江苏常州",
      need: "20公分香樟30棵",
      status: "待联系",
      demo: true
    },
    {
      id: "demo-2",
      name: "演示·湖州苗木采购商",
      region: "浙江湖州",
      need: "8—10公分樱花20棵",
      status: "已询价",
      demo: true
    },
    {
      id: "demo-3",
      name: "演示·南京景观施工企业",
      region: "江苏南京",
      need: "20公分香樟50棵",
      status: "已报价",
      demo: true
    }
  ]
};

const statuses = [
  "待联系", "已联系", "已询价",
  "已报价", "待看苗", "已成交", "无效线索"
];

function copyData(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateData(value) {
  if (!value || !Array.isArray(value.trees)
      || !Array.isArray(value.customers)) {
    throw new Error("备份文件结构不正确");
  }

  if (value.trees.length > 10000 ||
      value.customers.length > 10000) {
    throw new Error("备份数据量超出限制");
  }

  const ids = new Set();

  for (const tree of value.trees) {
    if (!tree || typeof tree.id !== "string" ||
        !tree.id || ids.has(tree.id) ||
        typeof tree.name !== "string" ||
        !tree.name.trim() || tree.name.length > 60 ||
        typeof tree.spec !== "string" ||
        tree.spec.length > 120 ||
        typeof tree.note !== "string" ||
        tree.note.length > 300 ||
        !(tree.quantity === null ||
          (Number.isInteger(tree.quantity) &&
           tree.quantity >= 0 &&
           tree.quantity <= 1000000))) {
      throw new Error("苗木记录存在无效数据");
    }
    ids.add(tree.id);
  }

  for (const customer of value.customers) {
    if (!customer ||
        typeof customer.id !== "string" ||
        !customer.id || ids.has(customer.id) ||
        typeof customer.name !== "string" ||
        !customer.name.trim() || customer.name.length > 100 ||
        typeof customer.region !== "string" ||
        customer.region.length > 100 ||
        typeof customer.need !== "string" ||
        customer.need.length > 200 ||
        !statuses.includes(customer.status) ||
        typeof customer.demo !== "boolean") {
      throw new Error("客户记录存在无效数据");
    }
    ids.add(customer.id);
  }

  return value;
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return copyData(initialData);

  try {
    return validateData(JSON.parse(saved));
  } catch (error) {
    alert("已有数据无法读取，请先检查或备份浏览器数据。");
    throw error;
  }
}

let data = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    alert("保存失败，请检查浏览器存储空间或权限。");
    console.error(error);
  }
}

// 2. 创建安全的表格内容
function cell(row, text) {
  const td = document.createElement("td");
  td.textContent = String(text ?? "");
  row.appendChild(td);
  return td;
}

function actionButton(label, action, id, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = danger ? "small danger" : "small secondary";
  button.addEventListener("click", () => action(id));
  return button;
}

function newId() {
  return "item-" + Date.now() + "-" +
    Math.random().toString(36).slice(2, 10);
}

// 3. 经营统计
function renderStats() {
  document.getElementById("speciesCount").textContent =
    new Set(data.trees.map(t => t.name)).size;

  const knownTrees = data.trees.filter(
    t => Number.isInteger(t.quantity)
  );

  const treeTotal = knownTrees.reduce(
    (sum, t) => sum + t.quantity, 0
  );

  document.getElementById("treeCount").textContent =
    knownTrees.length === data.trees.length
      ? treeTotal
      : treeTotal + " + 待盘点";

  const realCustomers = data.customers.filter(c => !c.demo);

  document.getElementById("customerCount").textContent =
    realCustomers.length;

  document.getElementById("inquiryCount").textContent =
    realCustomers.filter(c =>
      ["已询价", "已报价", "待看苗", "已成交"]
        .includes(c.status)
    ).length;
}

// 4. 苗木列表
function renderTrees() {
  const table = document.getElementById("treeTable");
  table.replaceChildren();

  for (const tree of data.trees) {
    const row = document.createElement("tr");

    cell(row, tree.name);
    cell(row, tree.spec);
    cell(row, tree.quantity === null
      ? "待盘点" : tree.quantity + " 棵");
    cell(row, tree.note);

    const actions = document.createElement("td");
    actions.append(
      actionButton("编辑", editTree, tree.id),
      actionButton("删除", deleteTree, tree.id, true)
    );
    row.appendChild(actions);
    table.appendChild(row);
  }
}

function resetTreeForm() {
  document.getElementById("treeForm").reset();
  document.getElementById("treeId").value = "";
  document.getElementById("treeSubmit").textContent = "保存苗木";
}

document.getElementById("treeForm").addEventListener(
  "submit", event => {
    event.preventDefault();

    const id = document.getElementById("treeId").value;

    const tree = {
      id: id || newId(),
      name: document.getElementById("treeName").value.trim(),
      spec: document.getElementById("treeSpec").value.trim(),
      quantity: Number(
        document.getElementById("treeQuantity").value
      ),
      note: document.getElementById("treeNote").value.trim()
    };

    if (!tree.name || !tree.spec ||
        !Number.isInteger(tree.quantity) ||
        tree.quantity < 0 || tree.quantity > 1000000) {
      alert("请填写有效的苗木名称、规格和数量。");
      return;
    }

    if (id) {
      data.trees = data.trees.map(
        item => item.id === id ? tree : item
      );
    } else {
      data.trees.push(tree);
    }

    saveData();
    resetTreeForm();
    renderAll();
  }
);

function editTree(id) {
  const tree = data.trees.find(t => t.id === id);
  if (!tree) return;

  document.getElementById("treeId").value = tree.id;
  document.getElementById("treeName").value = tree.name;
  document.getElementById("treeSpec").value = tree.spec;
  document.getElementById("treeQuantity").value =
    tree.quantity ?? "";
  document.getElementById("treeNote").value = tree.note;
  document.getElementById("treeSubmit").textContent = "更新苗木";

  document.getElementById("treeForm").scrollIntoView({
    behavior: "smooth"
  });
}

function deleteTree(id) {
  if (!confirm("确定删除这条苗木记录吗？")) return;

  data.trees = data.trees.filter(t => t.id !== id);
  saveData();
  resetTreeForm();
  renderAll();
}

document.getElementById("treeCancel")
  .addEventListener("click", resetTreeForm);

// 5. 客户列表
function renderCustomers() {
  const table = document.getElementById("customerTable");
  table.replaceChildren();

  for (const customer of data.customers) {
    const row = document.createElement("tr");

    cell(row, customer.name);
    cell(row, customer.region);
    cell(row, customer.need);
    cell(row, customer.status);
    cell(row, customer.demo ? "演示" : "真实");

    const actions = document.createElement("td");
    actions.append(
      actionButton("编辑", editCustomer, customer.id),
      actionButton("删除", deleteCustomer, customer.id, true)
    );
    row.appendChild(actions);
    table.appendChild(row);
  }
}

function resetCustomerForm() {
  document.getElementById("customerForm").reset();
  document.getElementById("customerId").value = "";
  document.getElementById("customerSubmit").textContent =
    "保存客户";
}

document.getElementById("customerForm").addEventListener(
  "submit", event => {
    event.preventDefault();

    const id = document.getElementById("customerId").value;

    const customer = {
      id: id || newId(),
      name: document.getElementById("customerName").value.trim(),
      region: document.getElementById("customerRegion").value.trim(),
      need: document.getElementById("customerNeed").value.trim(),
      status: document.getElementById("customerStatus").value,
      demo: document.getElementById("customerDemo").checked
    };

    if (!customer.name || !customer.need) {
      alert("请填写客户名称和采购需求。");
      return;
    }

    if (id) {
      data.customers = data.customers.map(
        item => item.id === id ? customer : item
      );
    } else {
      data.customers.push(customer);
    }

    saveData();
    resetCustomerForm();
    renderAll();
  }
);

function editCustomer(id) {
  const customer = data.customers.find(c => c.id === id);
  if (!customer) return;

  document.getElementById("customerId").value = customer.id;
  document.getElementById("customerName").value = customer.name;
  document.getElementById("customerRegion").value = customer.region;
  document.getElementById("customerNeed").value = customer.need;
  document.getElementById("customerStatus").value = customer.status;
  document.getElementById("customerDemo").checked = customer.demo;
  document.getElementById("customerSubmit").textContent =
    "更新客户";

  document.getElementById("customerForm").scrollIntoView({
    behavior: "smooth"
  });
}

function deleteCustomer(id) {
  if (!confirm("确定删除这条客户记录吗？")) return;

  data.customers = data.customers.filter(c => c.id !== id);
  saveData();
  resetCustomerForm();
  renderAll();
}

document.getElementById("customerCancel")
  .addEventListener("click", resetCustomerForm);

// 6. 导出备份
document.getElementById("exportButton")
  .addEventListener("click", () => {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      "langxi-nursery-backup-" +
      new Date().toISOString().slice(0, 10) + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

// 7. 导入备份
document.getElementById("importFile")
  .addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("文件过大，最大支持2MB。");
      event.target.value = "";
      return;
    }

    try {
      const imported = validateData(
        JSON.parse(await file.text())
      );

      if (!confirm("导入会覆盖现有全部数据，确定继续吗？")) {
        return;
      }

      const oldData = data;
      data = imported;

      try {
        localStorage.setItem(
          STORAGE_KEY, JSON.stringify(data)
        );
      } catch (error) {
        data = oldData;
        throw error;
      }

      resetTreeForm();
      resetCustomerForm();
      renderAll();
      alert("数据导入成功！");
    } catch (error) {
      alert("导入失败：" + error.message);
    } finally {
      event.target.value = "";
    }
  });

// 8. 统一刷新页面数据
function renderAll() {
  renderStats();
  renderTrees();
  renderCustomers();
}

// 第一次打开时显示演示数据
renderAll();

// V1.2 页面导航系统

const navButtons = document.querySelectorAll(
  ".page-nav button"
);

const pageSections = document.querySelectorAll(
  "[data-section]"
);

function showPage(pageName) {
  pageSections.forEach(section => {
    section.hidden =
      section.dataset.section !== pageName;
  });

  navButtons.forEach(button => {
    const isActive = button.dataset.page === pageName;

    button.classList.toggle("active", isActive);
    button.setAttribute(
      "aria-pressed",
      String(isActive)
    );
  });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// 默认进入经营总览
showPage("dashboard");
