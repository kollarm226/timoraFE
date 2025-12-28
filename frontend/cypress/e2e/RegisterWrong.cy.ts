describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/register')
  })
});

it('RegisterWrong', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/register')
  
  
  
  
  
  cy.get('input[formcontrolname="companyId"]').click().type('1');
  cy.get('input[formcontrolname="firstName"]').click();
  cy.get('input[formcontrolname="firstName"]').type('1');
  cy.get('input[formcontrolname="lastName"]').click();
  cy.get('input[formcontrolname="lastName"]').type('1');
  cy.get('input[formcontrolname="email"]').click();
  cy.get('input[formcontrolname="email"]').type('1');
  cy.get('input[formcontrolname="address"]').click();
  cy.get('input[formcontrolname="address"]').type('1');
  cy.get('input[formcontrolname="password"]').click();
  cy.get('[formcontrolname="confirmPassword"]').type('1');
  cy.get('input.ng-pristine').click().type('2');
  
  cy.get('.space-y-2 > :nth-child(2) > span').should('contain', 'Please enter at least 3 characters.');
  cy.get(':nth-child(4) > :nth-child(1)').should('contain', 'Please enter at least 2 characters.');
  cy.get(':nth-child(6) > :nth-child(1)').should('contain', 'Please enter at least 2 characters.');
  cy.get(':nth-child(8) > span').should('contain', 'Invalid email');
  cy.get('.space-y-2 > :nth-child(10)').should('contain', 'Please enter at least 5 characters.');
  cy.get(':nth-child(12) > :nth-child(1)').should('contain', 'Please enter at least 8 characters.');
  cy.get(':nth-child(14) > span').should('contain', 'Passwords don\'t match');
  cy.get(':nth-child(4) > :nth-child(2)').should('contain', 'Letters only.');
  cy.get(':nth-child(6) > :nth-child(2)').should('contain', 'Letters only.');
  cy.get(':nth-child(10) > :nth-child(2)').should('contain', 'Invalid characters.');
  cy.get(':nth-child(12) > :nth-child(2)').should('contain', 'Use : A-Z, a-z, 0-9,!-?');
  
  
});