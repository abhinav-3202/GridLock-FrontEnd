import { mockData } from '../data/mockData'

export async function getHotspotData() {
  try {
    // When ML team is ready, replace this URL
    // const response = await fetch('http://ml-server-url/api/predictions')
    // return await response.json()
    
    // For now, return mock data
    return mockData
  } catch (error) {
    console.error('API call failed, using mock data:', error)
    return mockData
  }
}