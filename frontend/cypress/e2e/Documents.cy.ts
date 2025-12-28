describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/documents')
  })
});

it('Documents', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/documents')
  
  cy.get('div:nth-child(1) > button.download-btn > mat-icon.mat-icon').click();
  cy.get('div:nth-child(2) > button.download-btn > mat-icon.mat-icon').click();
  cy.get('div:nth-child(3) button.download-btn mat-icon.mat-icon').click();
  cy.get('div:nth-child(4) button.download-btn mat-icon.mat-icon').click();
  cy.get('div:nth-child(5) button.download-btn mat-icon.mat-icon').click();
  cy.get('div:nth-child(6) button.download-btn mat-icon.mat-icon').click();
  cy.get('div:nth-child(7) button.download-btn mat-icon.mat-icon').click();
  cy.get('div:nth-child(8) button.download-btn mat-icon.mat-icon').click();
  
  cy.get('div:nth-child(1) > div.doc-left > div.doc-text > div.doc-title').should('be.visible').should('contain', 'Summer Newsletter')
  cy.get('div:nth-child(1) > div.doc-left > div.doc-text > div.doc-description').should('be.visible').should('contain', 'This is a overview from this summer.')
  cy.get('div:nth-child(1) > div.doc-left > mat-icon.mat-icon').should('be.visible')
  cy.get('div:nth-child(3) div.doc-title').should('contain', 'Company Magasine - November 25')
  cy.get('div:nth-child(3) div.doc-description').should('contain', 'This is new company magasine for month November.')
  cy.get('div:nth-child(3) div.doc-left mat-icon.mat-icon').should('be.visible')
});