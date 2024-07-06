import axios from 'axios'

const API_URL = 'http://localhost:5000/nodes'

export const fetchNodes = async () => {
  const response = await axios.get(API_URL)
  return response.data
}

export const updateNodeTitle = async (id: number, title: string) => {
  await axios.put(`${API_URL}/${id}`, { title })
}

export const deleteNode = async (id: number) => {
  await axios.delete(`${API_URL}/${id}`)
}

export const createNode = async (node: { title: string, parentId: number | null }) => {
  const response = await axios.post(API_URL, node)
  return response.data
}