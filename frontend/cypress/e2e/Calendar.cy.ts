describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/calendar')
  })
});

it('Calendar', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/calendar')
  
  cy.get('button.mat-calendar-next-button span.mat-mdc-button-touch-target').click();
  cy.get('button.mat-calendar-previous-button span.mat-mdc-button-touch-target').click();
  cy.get('button.mat-calendar-body-active span.mat-focus-indicator').click();
  cy.get('button.mat-calendar-body-active span.mat-focus-indicator').click();
  cy.get('#mat-input-0').click();
  cy.get('#mat-input-0').type('352025');
  cy.get('mat-form-field:nth-child(2) div.mat-mdc-form-field-infix').click();
  cy.get('#mat-input-1').type('452025');
  cy.get('#mat-input-2').click();
  cy.get('#mat-input-2').type('sdsdsdsdsdsdsdsdsdsdsd');
});