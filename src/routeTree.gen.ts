/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as MainImport } from './routes/_main.tsx'
import { Route as IndexImport } from './routes/index.tsx'
import { Route as MainEnrollImport } from './routes/_main/enroll.tsx'
import { Route as MainCloudImport } from './routes/_main/cloud.tsx'
import { Route as MainAboutImport } from './routes/_main/about.tsx'

// Create/Update Routes

const MainRoute = MainImport.update({
  id: '/_main',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const MainEnrollRoute = MainEnrollImport.update({
  path: '/enroll',
  getParentRoute: () => MainRoute,
} as any)

const MainCloudRoute = MainCloudImport.update({
  path: '/cloud',
  getParentRoute: () => MainRoute,
} as any)

const MainAboutRoute = MainAboutImport.update({
  path: '/about',
  getParentRoute: () => MainRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_main': {
      preLoaderRoute: typeof MainImport
      parentRoute: typeof rootRoute
    }
    '/_main/about': {
      preLoaderRoute: typeof MainAboutImport
      parentRoute: typeof MainImport
    }
    '/_main/cloud': {
      preLoaderRoute: typeof MainCloudImport
      parentRoute: typeof MainImport
    }
    '/_main/enroll': {
      preLoaderRoute: typeof MainEnrollImport
      parentRoute: typeof MainImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  MainRoute.addChildren([MainAboutRoute, MainCloudRoute, MainEnrollRoute]),
])

/* prettier-ignore-end */
