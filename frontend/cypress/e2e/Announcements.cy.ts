describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/announcements')
  })
});

it('AnnouncementsMessages', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/announcements')
  
   
  
  cy.get('div.latest-body').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(1) > div.preview').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(2) > div.preview').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(3) > div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(4) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(5) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(6) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(7) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(8) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(9) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(10) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(10) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(11) div.name').click();
  cy.get('button.detail-close').click();
  cy.get('div:nth-child(12) div.name').click();
  cy.get('button.detail-close').click();
  
 
  
});