import { expect, test } from '@playwright/test'

test('demo user can create and delete a category budget', async ({ page }) => {
  const categoryName = `E2E Orcamento ${Date.now()}`
  const now = new Date()

  await page.goto('/login')
  await page.getByTestId('demo-login-button').click()
  await expect(page.getByTestId('dashboard-page')).toBeVisible()

  await page.getByRole('link', { name: 'Categorias' }).click()
  await page.getByTestId('new-category-button').click()
  await page.getByTestId('category-name-input').fill(categoryName)
  await page.getByTestId('save-category-button').click()

  const categoryCard = page.getByTestId('category-card').filter({ hasText: categoryName })
  await expect(categoryCard).toBeVisible()

  await page.getByRole('link', { name: 'Orcamentos' }).click()
  await expect(page.getByTestId('budgets-page')).toBeVisible()
  await page.getByTestId('new-budget-button').click()
  await page.getByTestId('budget-category-select').selectOption({ label: categoryName })
  await page.getByTestId('budget-amount-input').fill('850')
  await page.getByTestId('budget-month-input').fill(String(now.getMonth() + 1))
  await page.getByTestId('budget-year-input').fill(String(now.getFullYear()))
  await page.getByTestId('save-budget-button').click()

  const budgetCard = page.getByTestId('budget-card').filter({ hasText: categoryName })
  await expect(budgetCard).toBeVisible()
  await expect(budgetCard).toContainText('R$ 850,00')

  await budgetCard.getByLabel('Excluir orcamento').click()
  await expect(budgetCard).toBeHidden()

  await page.getByRole('link', { name: 'Categorias' }).click()
  await categoryCard.getByLabel('Excluir categoria').click()
  await expect(categoryCard).toBeHidden()
})
