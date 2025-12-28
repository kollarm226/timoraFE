describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/login')
  })
});

it('LoginWrong', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/login')
  
  
  
  
  cy.get('input[formcontrolname="companyId"]').click();
  cy.get('input[formcontrolname="username"]').click();
  cy.get('input[formcontrolname="companyId"]').type('1');
  cy.get('input[formcontrolname="username"]').type('1');
  cy.get('input.ng-pristine').click();
  cy.get('input[formcontrolname="companyId"]').click();
  cy.get('input[formcontrolname="username"]').click();
  cy.get('input[formcontrolname="companyId"]').type('2');
  cy.get('input[formcontrolname="password"]').type('oo');
  cy.get('.space-y-2 > :nth-child(2) > span').should('contain', 'Please enter at least 3 characters.');
  cy.get(':nth-child(4) > span').should('contain', 'Please enter at least 2 characters.');
  cy.get(':nth-child(6) > span').should('contain', 'Please enter at least 8 characters.');
  
  
  
  
  
  cy.get('input[formcontrolname="companyId"]').click();
  cy.get('input[formcontrolname="username"]').click();
  cy.get('input[formcontrolname="companyId"]').type('12');
  cy.get('input[formcontrolname="username"]').type('Dano');
  cy.get('input.ng-invalid').click();
  cy.get('input[formcontrolname="password"]').type('56');
  cy.get('input.ng-invalid').type('Dano123');
  cy.get('button.text-white').click();
  cy.get('.mb-3').should('contain', 'Invalid credentials');
});