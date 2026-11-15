
const API_BASE_URL = "http://127.0.0.1:8765";

export async function getItems() {
  const response = await fetch(`${API_BASE_URL}/items/`);

  if (!response.ok) {
    throw new Error("Unable to fetch belongings");
  }

  return response.json();
}

export async function addItem(item) {
  const response = await fetch(`${API_BASE_URL}/items/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error("Unable to save item");
  }

  return response.json();
}

export async function deleteItem(itemId) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Unable to delete item");
  }

  return true;
}
