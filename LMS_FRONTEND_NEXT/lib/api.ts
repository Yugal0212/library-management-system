import { apiFetch } from "./http"

export type User = {
  isActive: boolean
  id: string
  email: string
  name: string
  role: "STUDENT" | "TEACHER" | "LIBRARIAN" | "ADMIN"
  isVerified?: boolean
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, any>
}

export type LibraryItemType = "BOOK" | "DVD" | "MAGAZINE" | "EQUIPMENT"

export type LibraryItem = {
  description: string
  id: string
  title: string
  type: LibraryItemType
  isbn?: string
  author?: string
  genre?: string
  director?: string
  manufacturer?: string
  model?: string
  category?: string
  publishedYear?: number
  totalCopies: number
  availableCopies?: number
  location?: string
  status?: string
  isArchived?: boolean
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, any>
  loans?: Loan[]
}

export type Loan = {
  id: string
  userId: string
  libraryItemId: string
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: "ACTIVE" | "RETURNED" | "OVERDUE"
  user?: { id: string; name: string; email: string }
  libraryItem?: LibraryItem
}

export type Reservation = {
  id: string
  userId: string
  libraryItemId: string
  status: "PENDING" | "FULFILLED" | "EXPIRED" | "CANCELLED"
  createdAt: string
  expiresAt: string
  user?: { id: string; name: string; email: string }
  libraryItem?: LibraryItem
}

export type Fine = {
  id: string
  userId: string
  loanId?: string
  amount: number
  reason: string
  status: "PENDING" | "PAID" | "WAIVED"
  createdAt: string
  dueDate?: string
  user?: { id: string; name: string; email: string }
  loan?: {
    id: string
    dueDate: string
    item?: {
      id: string
      title: string
      isbn?: string
      type: string
      description?: string
      metadata?: Record<string, any>
    }
  }
}

// ======================
// AUTHENTICATION APIs (as per features)
// ======================

export async function register(input: {
  name: string
  email: string
  password: string
  role: User["role"]
}) {
  return apiFetch<{ 
    message: string;
    isLibrarian?: boolean;
    isVerified?: boolean;
    requiresApproval?: boolean;
  }>("/auth/register", {
    method: "POST",
    json: input,
  })
}

export async function createPatron(input: {
  name: string
  email: string
  password: string
  role: "STUDENT" | "TEACHER"
  phone?: string
  address?: string
}) {
  const response = await apiFetch<{ message: string; data: User }>("/user/create-patron", {
    method: "POST",
    json: input,
  })
  return response.data
}

export async function verifyEmail(input: { email: string; otp: string }) {
  return apiFetch<{ 
    message: string; 
    user?: User; 
    accessToken?: string; 
    refreshToken?: string;
    isLibrarian?: boolean;
  }>("/auth/verify-email", {
    method: "POST",
    json: input,
  })
}

export async function login(input: { email: string; password: string }) {
  return apiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    json: input,
  })
}

export async function forgotPassword(input: { email: string }) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    json: input,
  })
}

export async function resetPassword(input: {
  email: string
  otp: string
  password: string
}) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    json: input,
  })
}

export async function refreshToken(input: { refreshToken: string }) {
  return apiFetch<{ accessToken: string; refreshToken: string }>("/auth/refresh-token", {
    method: "POST",
    json: input,
  })
}

export async function logout(input?: { refreshToken: string }) {
  if (input?.refreshToken) {
    return apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
      json: input,
    })
  } else {
    // Simple logout - just call the endpoint
    return apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
      json: { refreshToken: "" },
    })
  }
}

export async function getCurrentUser() {
  return apiFetch<User>("/user/me", { method: "GET" })
}

// ======================
// BOOKS APIs (as per features)
// ======================

export async function getBooks(filters?: {
  search?: string
  type?: LibraryItemType
  category?: string
  available?: boolean
  includeArchived?: boolean
}) {
  const params = new URLSearchParams()
  if (filters?.search) params.append("search", filters.search)
  if (filters?.type) params.append("type", filters.type)
  if (filters?.category) params.append("category", filters.category)
  if (filters?.available !== undefined) params.append("available", String(filters.available))
  
  // By default, exclude archived books unless explicitly requested
  if (filters?.includeArchived !== true) {
    params.append("isArchived", "false")
  }
  
  const url = params.toString() ? `/book?${params}` : "/book?isArchived=false"
  return apiFetch<LibraryItem[]>(url, { method: "GET" })
}

export async function searchBooks(query: string) {
  return apiFetch<LibraryItem[]>(`/book/search/${encodeURIComponent(query)}`, { method: "GET" })
}

export async function getBookById(id: string) {
  return apiFetch<LibraryItem>(`/book/${id}`, { method: "GET" })
}

export async function createBook(input: {
  title: string
  type: LibraryItemType
  description?: string
  isbn?: string
  publishedAt?: string
  location?: string
  metadata: Record<string, any>
}) {
  return apiFetch<LibraryItem>("/book", {
    method: "POST",
    json: input,
  })
}

export async function updateBook(id: string, input: {
  title?: string
  description?: string
  isbn?: string
  publishedAt?: string
  location?: string
  metadata?: Record<string, any>
}) {
  return apiFetch<LibraryItem>(`/book/${id}`, {
    method: "PATCH",
    json: input,
  })
}

export async function archiveBook(id: string) {
  return apiFetch<{ message: string }>(`/book/${id}`, {
    method: "DELETE",
  })
}

export async function unarchiveBook(id: string) {
  return apiFetch<LibraryItem>(`/book/${id}/unarchive`, {
    method: "PATCH",
  })
}

// ======================
// LOANS APIs (as per features)
// ======================

export async function borrowBook(input: { libraryItemId: string }) {
  return apiFetch<Loan>("/loan/borrow", {
    method: "POST",
    json: { itemId: input.libraryItemId },
  })
}

export async function createLoanForUser(input: { userId: string; libraryItemId: string }) {
  const response = await apiFetch<{ message: string; data: Loan }>("/loan/create-for-user", {
    method: "POST",
    json: { userId: input.userId, itemId: input.libraryItemId },
  })
  return response.data
}

export async function returnBook(loanId: string) {
  const response = await apiFetch<{ message: string; data?: any }>(`/loan/${loanId}/return`, {
    method: "PATCH",
  })
  return response
}

export async function renewLoan(loanId: string) {
  const response = await apiFetch<{ message: string; data: Loan }>(`/loan/${loanId}/renew`, {
    method: "PATCH",
  })
  return response.data
}

export async function getAllLoans() {
  const response = await apiFetch<{ message: string; data: Loan[] }>("/loan/all", { method: "GET" })
  return response.data
}

export async function getUserLoans(userId: string) {
  return apiFetch<Loan[]>(`/loan/user/${userId}`, { method: "GET" })
}

export async function getOverdueLoans() {
  const response = await apiFetch<{ message: string; data: Loan[] }>("/loan/overdue", { method: "GET" })
  return response.data
}

export async function sendDueReminders() {
  return apiFetch<{ message: string }>("/loan/send-due-reminders", {
    method: "POST",
  })
}

export async function sendOverdueNotifications() {
  return apiFetch<{ message: string }>("/loan/send-overdue-notifications", {
    method: "POST",
  })
}

// ======================
// RESERVATIONS APIs (as per features)
// ======================

export async function createReservation(input: { libraryItemId: string }) {
  return apiFetch<Reservation>("/reservation", {
    method: "POST",
    json: { itemId: input.libraryItemId },
  })
}

export async function getAllReservations() {
  const response = await apiFetch<{ message: string; data: Reservation[] }>("/reservation", { method: "GET" })
  return response.data
}

export async function getMyReservations() {
  const response = await apiFetch<{ message: string; data: Reservation[] }>("/reservation/my", { method: "GET" })
  return response.data
}

export async function cancelReservation(reservationId: string) {
  return apiFetch<{ message: string }>(`/reservation/${reservationId}`, {
    method: "DELETE",
  })
}

export async function approveReservation(reservationId: string) {
  return apiFetch<{ message: string; data: any }>(`/reservation/${reservationId}/approve`, {
    method: "PATCH",
  })
}

// ======================
// FINES APIs (as per features)
// ======================

export async function createFine(input: {
  userId: string
  loanId?: string
  amount: number
  reason: string
  dueDate?: string
}) {
  return apiFetch<Fine>("/fines", {
    method: "POST",
    json: input,
  })
}

export async function getAllFines() {
  const response = await apiFetch<{ message: string; data: Fine[] }>("/fines", { method: "GET" })
  return response.data
}

export async function getMyFines() {
  const response = await apiFetch<{ message: string; data: Fine[] }>("/fines/my", { method: "GET" })
  return response.data
}

export async function getFineById(id: string) {
  return apiFetch<Fine>(`/fines/${id}`, { method: "GET" })
}

export async function updateFine(id: string, input: {
  amount?: number
  reason?: string
  status?: "PENDING" | "PAID" | "WAIVED"
  dueDate?: string
}) {
  return apiFetch<Fine>(`/fines/${id}`, {
    method: "PATCH",
    json: input,
  })
}

export async function payFine(id: string) {
  return apiFetch<Fine>(`/fines/${id}/pay`, {
    method: "PATCH",
  })
}

export async function waiveFine(id: string) {
  return apiFetch<Fine>(`/fines/${id}/waive`, {
    method: "PATCH",
  })
}

export async function deleteFine(id: string) {
  return apiFetch<{ message: string }>(`/fines/${id}`, {
    method: "DELETE",
  })
}

export async function calculateOverdueFines() {
  return apiFetch<{ message: string; finesCreated: number }>("/fines/calculate-overdue", {
    method: "POST",
  })
}

export async function sendFineReminder(id: string) {
  return apiFetch<{ message: string; sentTo: string }>(`/fines/${id}/send-reminder`, {
    method: "POST",
  })
}

// ======================
// USERS APIs (as per features)
// ======================

export async function createUser(input: {
  name: string
  email: string
  password: string
  role: User["role"]
}) {
  return apiFetch<User>("/user", {
    method: "POST",
    json: input,
  })
}

export async function getUsers() {
  const response = await apiFetch<{ message: string; data: User[] }>("/user", { method: "GET" })
  return response.data
}

export async function getMyProfile() {
  return apiFetch<User>("/user/me", { method: "GET" })
}

export async function getUserById(id: string) {
  return apiFetch<User>(`/user/${id}`, { method: "GET" })
}

export async function updateUser(id: string, input: {
  name?: string
  email?: string
  password?: string
  role?: User["role"]
  isActive?: boolean
  metadata?: Record<string, any>
}) {
  return apiFetch<User>(`/user/${id}`, {
    method: "PATCH",
    json: input,
  })
}

export async function updateMyProfile(input: {
  name?: string
  email?: string
  password?: string
  metadata?: Record<string, any>
}) {
  return apiFetch<User>("/user/me", {
    method: "PATCH",
    json: input,
  })
}

export async function deleteUser(id: string) {
  return apiFetch<{ message: string }>(`/user/${id}`, {
    method: "DELETE",
  })
}

export async function getUserAnalytics() {
  return apiFetch<{
    overview: { totalUsers: number; activeUsers: number; inactiveUsers: number; monthlyGrowth: number; growthRate: number }
    distribution: { byRole: Record<string, number>; byVerification: Record<string, number> }
    activity: { mostActiveUsers: any[] }
  }>("/user/analytics", { method: "GET" })
}

export async function bulkUserAction(userIds: string[], action: 'activate' | 'deactivate' | 'delete') {
  return apiFetch<{ message: string; affectedUsers: number }>("/user/bulk-action", {
    method: "POST",
    json: { userIds, action }
  })
}

// ======================
// ACTIVITIES APIs (as per features)
// ======================

export async function createActivity(input: {
  action: string
  entityType: string
  entityId: string
  details?: Record<string, any>
}) {
  return apiFetch<{ message: string }>("/activities", {
    method: "POST",
    json: input,
  })
}

export async function getActivities(filters?: {
  userId?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  if (filters?.userId) params.append("userId", filters.userId)
  if (filters?.action) params.append("action", filters.action)
  if (filters?.entityType) params.append("entityType", filters.entityType)
  if (filters?.startDate) params.append("startDate", filters.startDate)
  if (filters?.endDate) params.append("endDate", filters.endDate)
  if (filters?.limit) params.append("limit", String(filters.limit))
  if (filters?.offset) params.append("offset", String(filters.offset))
  
  const url = params.toString() ? `/activities?${params}` : "/activities"
  return apiFetch<any[]>(url, { method: "GET" })
}

// ======================
// ALIASES for backward compatibility
// ======================

// Library Items (alias to Books)
export const getLibraryItems = getBooks
export const getLibraryItem = getBookById
export const createLibraryItem = createBook
export const updateLibraryItem = updateBook
export const deleteLibraryItem = archiveBook
export const unarchiveLibraryItem = unarchiveBook
export const searchLibraryItems = searchBooks

// Loans
export const borrowItem = borrowBook
export const returnItem = returnBook
export async function getMyLoans() {
  return apiFetch<{ message: string; data: Loan[] }>("/loan/my-loans", { method: "GET" })
    .then(response => response.data)
}
export const confirmReturn = returnBook

// Reservations
export const reserveItem = createReservation
export const getReservations = getAllReservations

// Profile
export const updateProfile = updateMyProfile

// Activities
export const getRecentActivities = (limit = 50) => getActivities({ limit })

// ======================
// MISSING FUNCTIONS - Added for dashboard compatibility  
// ======================

// For Admin Dashboard - These will need backend implementation if needed
export async function getDashboardStats() {
  // This function doesn't exist in FEATURES.md, so return mock data
  // Pages should calculate stats from available APIs instead
  return {}
}

export async function getLibrarianRequests() {
  // This calls the backend librarian-requests controller
  return apiFetch<any[]>("/librarian-requests", { method: "GET" })
}

export async function approveLibrarian(id: string) {
  // This calls the backend librarian-requests controller
  return apiFetch<{ message: string }>(`/librarian-requests/${id}/approve`, { method: "PATCH" })
}

export async function rejectLibrarian(id: string) {
  // This calls the backend librarian-requests controller  
  return apiFetch<{ message: string }>(`/librarian-requests/${id}/reject`, { method: "PATCH" })
}

export async function getUserStats() {
  // This function doesn't exist in FEATURES.md
  return {}
}

// Book statistics API
export async function getBookStats() {
  return apiFetch("/book/stats", {
    method: "GET",
  })
}

// Delete book API (archives the book)
export async function deleteBook(id: string) {
  return apiFetch(`/book/${id}`, {
    method: "DELETE",
  })
}

// Permanently delete book API (admin only)
export async function permanentDeleteBook(id: string) {
  return apiFetch(`/book/${id}/permanent`, {
    method: "DELETE",
  })
}

// Helper function for dashboard layout
export function mapRoleToPath(role: User["role"]): string {
  switch (role) {
    case "ADMIN":
      return "admin"
    case "LIBRARIAN":
      return "librarian"
    case "STUDENT":
    case "TEACHER":
    default:
      return "patron"
  }
}
