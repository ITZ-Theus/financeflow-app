import { expect, test } from '@playwright/test'

test('demo user can access dashboard and create a category', async ({ page }) => {
  const categoryName = `E2E Categoria ${Date.now()}`

  await page.goto('/login')
  await page.getByTestId('demo-login-button').click()

  await expect(page.getByTestId('dashboard-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.getByRole('link', { name: 'Categorias' }).click()
  await page.getByTestId('new-category-button').click()
  await page.getByTestId('category-name-input').fill(categoryName)
  await page.getByTestId('save-category-button').click()

  const categoryCard = page.getByTestId('category-card').filter({ hasText: categoryName })
  await expect(categoryCard).toBeVisible()

  await categoryCard.getByLabel('Excluir categoria').click()
  await expect(categoryCard).toBeHidden()
})
