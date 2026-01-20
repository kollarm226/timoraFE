describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
  })
});

it('Documents', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
  cy.viewport(1920, 1080);

  cy.get('a[routerlink="/documents"] span.mat-mdc-list-item-title').click();
  cy.get('span.mdc-button__label').click();
  cy.get('#mat-input-0').click();
  cy.get('#mat-input-0').type('NEW');
  cy.get('#mat-input-1').click();
  cy.get('#mat-input-1').type('NEW NEWNEW');
  cy.get('#mat-input-2').click();
  cy.get('#mat-input-2').type('https://');
  
  
  cy.get('#mat-mdc-dialog-0 button.mat-primary span.mdc-button__label').click();
  cy.get('div:nth-child(1) > div.doc-actions > button.delete-btn').click();
});
