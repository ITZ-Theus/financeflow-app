import { expect, test } from '@playwright/test'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

test('demo user can create, edit and delete a transaction', async ({ page }) => {
  const transactionTitle = `E2E Transacao ${Date.now()}`
  const editedTitle = `${transactionTitle} Editada`

  await page.goto('/login')
  await page.getByTestId('demo-login-button').click()

  await expect(page.getByTestId('dashboard-page')).toBeVisible()

  await page.goto('/transactions')
  await expect(page.getByTestId('transactions-page')).toBeVisible()

  await page.getByTestId('new-transaction-button').click()
  await page.getByTestId('transaction-title-input').fill(transactionTitle)
  await page.getByTestId('transaction-amount-input').fill('12345')
  await page.getByTestId('transaction-type-select').selectOption('income')
  await page.getByTestId('transaction-date-input').fill(todayDate())
  await page.getByTestId('transaction-description-input').fill('Criada pelo fluxo E2E')
  await page.getByTestId('save-transaction-button').click()

  const createdRow = page.getByTestId('transaction-row').filter({ hasText: transactionTitle })
  await expect(createdRow).toBeVisible()
  await expect(createdRow).toContainText(/\+R\$\s?123,45/)

  await createdRow.getByLabel('Editar transacao').click()
  await page.getByTestId('transaction-title-input').fill(editedTitle)
  await page.getByTestId('save-transaction-button').click()

  const editedRow = page.getByTestId('transaction-row').filter({ hasText: editedTitle })
  await expect(editedRow).toBeVisible()

  await editedRow.getByLabel('Excluir transacao').click()
  await expect(editedRow).toBeHidden()
})
