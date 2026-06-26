# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A website dedicated to making the classic Australian music TV show RAGE accessible online.

## Status

This repository is in its initial scaffolding state — no source code, build system, or configuration files exist yet beyond the README and LICENSE.

## Stack

The stack will likely use Cloudflare workers, to scrape the Rage playlist page (https://www.abc.net.au/rage/playlist#all) and collate a list of playlists, and the videos listed inside. Cloudflare has the D1 database system that would suit storage, and Cheerio is a popular library for parsing the HTML we're looking at. For the frontend We'll use React with the Charkra UI library, Axios for web requests, React Router for the browser routing, VAPID for push notifications about events in the backend. My login-with.link authentication service will do for aythentication the admin interface. Drizzle is probably the best option for an ORM - Claude suggested that it would work well with D1. ESBuild is my preferred way to build web JS assets.

## Third party

### Login-with.link

Login-with.link is an ultralight authentication solution - it simply provides an option for a user to be emailed a link (verifying their email address) that then generates a JWT and attaches that to a link for redirection.
