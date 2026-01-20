describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
  })
});

it('Contact', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')
   cy.viewport(1920, 1080);
  
  
  cy.get('a[routerlink="/contact"] span.mat-mdc-list-item-title').click();
  cy.get('select:nth-child(2)').select('Employee');
  cy.get('select.ng-dirty').select('Employer');
  cy.get('select.ng-dirty').select('Admin');
  cy.get('.filter-select.ng-untouched')
  cy.get('button.clear-filters').click();
  cy.get('mat-icon[fonticon="send"]').click();
});