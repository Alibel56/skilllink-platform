import type { StoredUser, Booking, OrderChats } from '../types';

export const getUsers = (): StoredUser[] =>
  JSON.parse(localStorage.getItem('users') || '[]');

export const saveUsers = (users: StoredUser[]) =>
  localStorage.setItem('users', JSON.stringify(users));

export const registerUser = (newUser: StoredUser) => {
  const users = getUsers();
  if (users.some(u => u.email === newUser.email)) throw new Error('User already exists');
  users.push(newUser);
  saveUsers(users);
};

export const getBookings = (): Booking[] =>
  JSON.parse(localStorage.getItem('bookings') || '[]');

export const saveBookings = (bookings: Booking[]) =>
  localStorage.setItem('bookings', JSON.stringify(bookings));

export const getOrderChats = (): OrderChats =>
  JSON.parse(localStorage.getItem('orderChats') || '{}');

export const saveOrderChats = (chats: OrderChats) =>
  localStorage.setItem('orderChats', JSON.stringify(chats));