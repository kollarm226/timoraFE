describe('Attempt to reserve vacation', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/')

      cy.viewport(1920, 1080);

      cy.get('[formcontrolname="password"]')
      .type('Testing123!')
      .should('have.value', 'Testing123!')
      
      cy.get('[formcontrolname="email"]')
      .type('dzvonikdaniel@gmail.com')
      .should('have.value', 'dzvonikdaniel@gmail.com')

      cy.wait(10000);

      cy.get('[routerlink="/calendar"]').click();
      cy.get(':nth-child(4) > [data-mat-col="5"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();
      cy.get(':nth-child(5) > [data-mat-col="1"] > .mat-calendar-body-cell > .mat-calendar-body-cell-content').click();

      cy.get('#mat-input-2').click();
      cy.get('#mat-input-2').type('Meeting with client Meeting with client Meeting with client');
      cy.get('.submit-btn > .mdc-button__label').click();

      cy.get('[routerlink="/dashboard"]').click();

      cy.get('#mat-mdc-chip-14 > .mdc-evolution-chip__cell > .mdc-evolution-chip__action > .mdc-evolution-chip__text-label').should('contain', 'Pending');
      cy.get(':nth-child(4) > .actions-cell > .mdc-button > .mdc-button__label').click();
  })
})