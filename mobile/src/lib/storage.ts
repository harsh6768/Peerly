import * as SecureStore from 'expo-secure-store'

const APP_SESSION_KEY = 'cirvo.app-session'

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(APP_SESSION_KEY)
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(APP_SESSION_KEY, token)
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_SESSION_KEY)
}
