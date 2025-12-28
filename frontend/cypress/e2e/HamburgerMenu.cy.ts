describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/dashboard')
  })
});

it('HamburgerMenu', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/dashboard')
  
   
  cy.get('a.active span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/calendar"] span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/announcements"] span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/contact"] span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/documents"] span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/about"] span.mat-mdc-list-item-title').click();
  cy.get('a[routerlink="/faq"]').click();
  
   
});