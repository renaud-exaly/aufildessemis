import { expect, test } from '@playwright/test'

test.describe('public site smoke', () => {
  test('home page renders the hero and notebook widget', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toContainText('Suivons nos semis')
    await expect(page.getByText("Aujourd'hui au potager")).toBeVisible()
  })

  test('library lists the seeded plants', async ({ page }) => {
    await page.goto('/bibliotheque')
    await expect(page.getByRole('heading', { name: 'La bibliothèque' })).toBeVisible()
    for (const name of ['Courgette', 'Poivron', 'Basilic', 'Tomate']) {
      await expect(page.getByRole('heading', { name })).toBeVisible()
    }
  })

  test('plant detail shows stages and latin name', async ({ page }) => {
    await page.goto('/bibliotheque/courgette')
    await expect(page.getByText('Cucurbita pepo')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Étapes typiques' })).toBeVisible()
    await expect(page.getByText('Mise en terre')).toBeVisible()
  })

  test('calendar marks the current month', async ({ page }) => {
    await page.goto('/calendrier')
    await expect(page.getByRole('heading', { name: /Que semer, quand/ })).toBeVisible()
    await expect(page.getByText('Ce mois-ci').first()).toBeVisible()
  })

  test('login page is reachable from header', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Se connecter|Mon potager/ }).click()
    await expect(page).toHaveURL(/mon-potager/)
  })
})
