describe('Attempt to create new announcement', () => {
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
      cy.get('[routerlink="/announcements"]').click();
      cy.get('.mdc-button__label').click();

      cy.get('#mat-input-0').click();
      cy.get('#mat-input-0').type('New Announcement Title');
      cy.get('#mat-input-1').click();
      cy.get('#mat-input-1').type('This is the content of the new announcement being created for testing purposes.');
      cy.wait(5000);
      cy.get('#mat-mdc-dialog-0 button.mat-primary span.mdc-button__label').click();

      cy.get('.latest-title').should('contain', 'New Announcement Title');

})});


