/*
 * Game Options - Character, Terrain, Ball and Effects
 * Programmatically drawn options for the Gorillas game
 */

// Character options storage
const gameOptions = {
  characters: [
    {
      id: 'default',
      name: 'Classic Gorilla',
      type: 'image', 
      src: 'character.png'
    },
    {
      id: 'robot',
      name: 'Robot',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        // Robot character
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        
        // Body - rectangle with rounded corners
        ctx.fillStyle = '#555';
        roundedRect(ctx, -30 * scale, -90, 60 * scale, 70, 8);
        
        // Head
        ctx.fillStyle = '#777';
        roundedRect(ctx, -25 * scale, -110, 50 * scale, 40, 5);
        
        // Eyes
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(-15 * scale, -95, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(5 * scale, -95, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15 * scale, -80);
        ctx.lineTo(15 * scale, -80);
        ctx.stroke();
        
        // Arms with animation during aiming
        ctx.fillStyle = '#666';
        
        // Calculate arm position adjustments based on aiming
        let rightArmX = 25 * scale;
        let rightArmY = -80;
        let leftArmX = -40 * scale;
        let leftArmY = -80;
        let armLength = 40;
        
        // If aiming, adjust the arm position
        if (aimingData.isAiming) {
          // Normalize velocity for arm movement (capped at 30px)
          const maxVelocity = 30;
          const normVelX = Math.min(Math.abs(aimingData.velocityX), maxVelocity) / maxVelocity;
          const normVelY = Math.min(Math.abs(aimingData.velocityY), maxVelocity) / maxVelocity;
          
          // Left or right arm extends depending on player's position (velocity is inverted)
          const throwingArm = scale > 0 ? 'left' : 'right';
          
          if (throwingArm === 'right') {
            // Adjust right arm for aiming
            rightArmX = (25 + normVelX * 10) * scale;
            rightArmY = -80 + normVelY * 15;
            armLength = 40 + (normVelX + normVelY) * 10;
          } else {
            // Adjust left arm for aiming
            leftArmX = (-40 - normVelX * 10) * scale;
            leftArmY = -80 + normVelY * 15;
            armLength = 40 + (normVelX + normVelY) * 10;
          }
        }
        
        // Left arm
        roundedRect(ctx, leftArmX, leftArmY, 15 * scale, armLength, 5);
        // Right arm
        roundedRect(ctx, rightArmX, rightArmY, 15 * scale, armLength, 5);
        
        // Legs
        // Left leg
        roundedRect(ctx, -25 * scale, -30, 15 * scale, 30, 5);
        // Right leg
        roundedRect(ctx, 10 * scale, -30, 15 * scale, 30, 5);
        
        // Antenna
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -110);
        ctx.lineTo(0, -125);
        ctx.stroke();
        
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(0, -130, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'alien',
      name: 'Alien',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        // Alien character
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        
        // Head (large oval)
        ctx.fillStyle = '#3dd171';
        ctx.beginPath();
        ctx.ellipse(0, -100, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (large almond shaped)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(-10 * scale, -105, 8, 12, Math.PI/4 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(10 * scale, -105, 8, 12, -Math.PI/4 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Small body
        ctx.fillStyle = '#3dd171';
        ctx.beginPath();
        ctx.ellipse(0, -60, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Thin arms with animation during aiming
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3dd171';
        
        // Default arm positions
        let leftArmStartX = -15 * scale;
        let leftArmStartY = -65;
        let leftArmControlX = -30 * scale;
        let leftArmControlY = -80;
        let leftArmEndX = -35 * scale;
        let leftArmEndY = -60;
        
        let rightArmStartX = 15 * scale;
        let rightArmStartY = -65;
        let rightArmControlX = 30 * scale;
        let rightArmControlY = -80;
        let rightArmEndX = 35 * scale;
        let rightArmEndY = -60;
        
        // Adjust arms if aiming
        if (aimingData.isAiming) {
          // Normalize velocity for arm movement
          const maxVelocity = 30;
          const normVelX = Math.min(Math.abs(aimingData.velocityX), maxVelocity) / maxVelocity;
          const normVelY = Math.min(Math.abs(aimingData.velocityY), maxVelocity) / maxVelocity;
          
          // Left or right arm extends depending on player's position
          const throwingArm = scale > 0 ? 'left' : 'right';
          
          if (throwingArm === 'right') {
            // Adjust right arm for aiming
            rightArmControlX = (30 + normVelX * 15) * scale;
            rightArmControlY = -80 + normVelY * 20;
            rightArmEndX = (35 + normVelX * 10) * scale;
            rightArmEndY = -60 + normVelY * 15;
          } else {
            // Adjust left arm for aiming
            leftArmControlX = (-30 - normVelX * 15) * scale;
            leftArmControlY = -80 + normVelY * 20;
            leftArmEndX = (-35 - normVelX * 10) * scale;
            leftArmEndY = -60 + normVelY * 15;
          }
        }
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(leftArmStartX, leftArmStartY);
        ctx.quadraticCurveTo(leftArmControlX, leftArmControlY, leftArmEndX, leftArmEndY);
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(rightArmStartX, rightArmStartY);
        ctx.quadraticCurveTo(rightArmControlX, rightArmControlY, rightArmEndX, rightArmEndY);
        ctx.stroke();
        
        // Thin legs
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -40);
        ctx.lineTo(-15 * scale, -20);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(10 * scale, -40);
        ctx.lineTo(15 * scale, -20);
        ctx.stroke();
        
        // Antenna
        ctx.beginPath();
        ctx.moveTo(0, -130);
        ctx.lineTo(0, -150);
        ctx.stroke();
        
        ctx.fillStyle = '#3dd171';
        ctx.beginPath();
        ctx.arc(0, -150, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'ninja',
      name: 'Ninja',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        // Ninja character
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        
        // Body
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(0, -70, 25, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head with mask
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -110, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye strip
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.rect(-15 * scale, -115, 30 * scale, 5);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-8 * scale, -112.5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(8 * scale, -112.5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Arms with animation during aiming
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 10;
        
        // Default arm positions
        let leftArmStartX = -15 * scale;
        let leftArmStartY = -80;
        let leftArmEndX = -35 * scale;
        let leftArmEndY = -100;
        
        let rightArmStartX = 15 * scale;
        let rightArmStartY = -80;
        let rightArmEndX = 35 * scale;
        let rightArmEndY = -60;
        
        // Adjust arms if aiming
        if (aimingData.isAiming) {
          // Normalize velocity for arm movement
          const maxVelocity = 30;
          const normVelX = Math.min(Math.abs(aimingData.velocityX), maxVelocity) / maxVelocity;
          const normVelY = Math.min(Math.abs(aimingData.velocityY), maxVelocity) / maxVelocity;
          
          // Left or right arm extends depending on player's position
          const throwingArm = scale > 0 ? 'left' : 'right';
          
          if (throwingArm === 'right') {
            // Adjust right arm for aiming (throwing pose)
            rightArmEndX = (35 + normVelX * 15) * scale;
            rightArmEndY = -60 - normVelY * 20;
          } else {
            // Adjust left arm for aiming (throwing pose)
            leftArmEndX = (-35 - normVelX * 15) * scale;
            leftArmEndY = -100 + normVelY * 30;
          }
        }
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(leftArmStartX, leftArmStartY);
        ctx.lineTo(leftArmEndX, leftArmEndY);
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(rightArmStartX, rightArmStartY);
        ctx.lineTo(rightArmEndX, rightArmEndY);
        ctx.stroke();
        
        // Legs
        ctx.lineWidth = 8;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -40);
        ctx.lineTo(-15 * scale, -10);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(10 * scale, -40);
        ctx.lineTo(15 * scale, -10);
        ctx.stroke();
        
        // Ninja band tails
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -130);
        ctx.quadraticCurveTo(20 * scale, -140, 30 * scale, -120);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -130);
        ctx.quadraticCurveTo(10 * scale, -145, 15 * scale, -135);
        ctx.stroke();
        
        ctx.restore();
      }
    },
    {
      id: 'pirate',
      name: 'Pirate',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Body
        ctx.fillStyle = '#7B3F00';
        ctx.beginPath();
        ctx.ellipse(0, -70, 22, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#FCD299';
        ctx.beginPath();
        ctx.arc(0, -110, 18, 0, Math.PI * 2);
        ctx.fill();
        // Eye patch
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-7 * scale, -112, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-7 * scale, -112);
        ctx.lineTo(7 * scale, -112);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Smile
        ctx.strokeStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(0, -105, 7, 0, Math.PI);
        ctx.stroke();
        // Hat
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(0, -125, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -132, 14, Math.PI, 2 * Math.PI);
        ctx.fill();
        // Arms
        ctx.strokeStyle = '#7B3F00';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-18 * scale, -80);
        ctx.lineTo(-38 * scale, -100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(18 * scale, -80);
        ctx.lineTo(38 * scale, -60);
        ctx.stroke();
        // Hook hand (right arm)
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(38 * scale, -60, 5, Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
        // Legs
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -32);
        ctx.lineTo(-12 * scale, -10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8 * scale, -32);
        ctx.lineTo(12 * scale, -10);
        ctx.stroke();
        // Peg leg (left leg)
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-12 * scale, -10);
        ctx.lineTo(-12 * scale, 0);
        ctx.stroke();
        ctx.restore();
      }
    },
    {
      id: 'robotcat',
      name: 'Robot Cat',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Body
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.ellipse(0, -70, 20, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#CFD8DC';
        ctx.beginPath();
        ctx.arc(0, -110, 16, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#00E5FF';
        ctx.beginPath();
        ctx.arc(-6 * scale, -112, 3, 0, Math.PI * 2);
        ctx.arc(6 * scale, -112, 3, 0, Math.PI * 2);
        ctx.fill();
        // Mouth
        ctx.strokeStyle = '#607D8B';
        ctx.beginPath();
        ctx.arc(0, -105, 5, 0, Math.PI);
        ctx.stroke();
        // Ears
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -122);
        ctx.lineTo(-18 * scale, -135);
        ctx.lineTo(-2 * scale, -120);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10 * scale, -122);
        ctx.lineTo(18 * scale, -135);
        ctx.lineTo(2 * scale, -120);
        ctx.closePath();
        ctx.fill();
        // Arms
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-15 * scale, -80);
        ctx.lineTo(-35 * scale, -90);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15 * scale, -80);
        ctx.lineTo(35 * scale, -70);
        ctx.stroke();
        // Tail
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.bezierCurveTo(20 * scale, -20, 10 * scale, 10, 0, 0);
        ctx.stroke();
        ctx.restore();
      }
    },
    {
      id: 'knight',
      name: 'Knight',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Legs
        ctx.strokeStyle = '#78909C';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -34);
        ctx.lineTo(-10 * scale, -4);
        ctx.moveTo(8 * scale, -34);
        ctx.lineTo(10 * scale, -4);
        ctx.stroke();
        // Body armour
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.moveTo(-22 * scale, -35);
        ctx.lineTo(-18 * scale, -88);
        ctx.lineTo(18 * scale, -88);
        ctx.lineTo(22 * scale, -35);
        ctx.closePath();
        ctx.fill();
        // Chest plate highlight
        ctx.fillStyle = '#CFD8DC';
        ctx.beginPath();
        ctx.moveTo(-8 * scale, -84);
        ctx.lineTo(8 * scale, -84);
        ctx.lineTo(6 * scale, -42);
        ctx.lineTo(-6 * scale, -42);
        ctx.closePath();
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.arc(0, -108, 20, Math.PI, 2 * Math.PI);
        ctx.fill();
        ctx.fillRect(-20 * scale, -108, 40 * scale, 16);
        // Visor slit
        ctx.fillStyle = '#263238';
        ctx.fillRect(-14 * scale, -104, 28 * scale, 6);
        // Eyes glow
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(-9 * scale, -103, 5, 4);
        ctx.fillRect(4 * scale, -103, 5, 4);
        // Red plume
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.moveTo(0, -126);
        ctx.quadraticCurveTo(-4 * scale, -146, 10 * scale, -150);
        ctx.quadraticCurveTo(4 * scale, -136, 4 * scale, -124);
        ctx.closePath();
        ctx.fill();
        // Arms
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-18 * scale, -80);
        ctx.lineTo(-34 * scale, -92);
        ctx.moveTo(18 * scale, -80);
        ctx.lineTo(34 * scale, -66);
        ctx.stroke();
        // Sword
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(34 * scale, -66);
        ctx.lineTo(52 * scale, -112);
        ctx.stroke();
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(30 * scale, -72);
        ctx.lineTo(40 * scale, -66);
        ctx.stroke();
        // Shield
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(-36 * scale, -80, 10, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(-36 * scale, -80, 10, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    },
    {
      id: 'wizard',
      name: 'Wizard',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Robe
        ctx.fillStyle = '#5E35B1';
        ctx.beginPath();
        ctx.moveTo(-26 * scale, 0);
        ctx.lineTo(-16 * scale, -92);
        ctx.lineTo(16 * scale, -92);
        ctx.lineTo(26 * scale, 0);
        ctx.closePath();
        ctx.fill();
        // Robe trim
        ctx.fillStyle = '#9575CD';
        ctx.fillRect(-26 * scale, -8, 52 * scale, 8);
        // Head
        ctx.fillStyle = '#FFCC9C';
        ctx.beginPath();
        ctx.arc(0, -108, 17, 0, Math.PI * 2);
        ctx.fill();
        // Beard
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.moveTo(-14 * scale, -104);
        ctx.quadraticCurveTo(0, -58, 14 * scale, -104);
        ctx.quadraticCurveTo(0, -92, -14 * scale, -104);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(-6 * scale, -112, 2.5, 0, Math.PI * 2);
        ctx.arc(6 * scale, -112, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Hat
        ctx.fillStyle = '#4527A0';
        ctx.beginPath();
        ctx.moveTo(-24 * scale, -118);
        ctx.lineTo(4 * scale, -158);
        ctx.lineTo(10 * scale, -118);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -118, 26, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Hat star
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(2 * scale, -132, 3, 0, Math.PI * 2);
        ctx.fill();
        // Arms
        ctx.strokeStyle = '#5E35B1';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-16 * scale, -80);
        ctx.lineTo(-34 * scale, -96);
        ctx.moveTo(16 * scale, -80);
        ctx.lineTo(34 * scale, -72);
        ctx.stroke();
        // Staff with a glowing orb
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-38 * scale, 0);
        ctx.lineTo(-38 * scale, -120);
        ctx.stroke();
        ctx.fillStyle = '#80DEEA';
        ctx.beginPath();
        ctx.arc(-38 * scale, -124, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    {
      id: 'dino',
      name: 'Dino',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Tail
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(-14 * scale, -46);
        ctx.quadraticCurveTo(-46 * scale, -46, -54 * scale, -14);
        ctx.stroke();
        // Body
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.ellipse(0, -62, 24, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        // Belly
        ctx.fillStyle = '#A5D6A7';
        ctx.beginPath();
        ctx.ellipse(0, -54, 14, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.ellipse(2 * scale, -108, 20, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.beginPath();
        ctx.ellipse(16 * scale, -102, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(4 * scale, -114, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(6 * scale, -114, 3, 0, Math.PI * 2);
        ctx.fill();
        // Spikes
        ctx.fillStyle = '#1B5E20';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 10 * scale - 4, -88);
          ctx.lineTo(i * 10 * scale, -100);
          ctx.lineTo(i * 10 * scale + 4, -88);
          ctx.closePath();
          ctx.fill();
        }
        // Little arms
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-18 * scale, -74);
        ctx.lineTo(-32 * scale, -84);
        ctx.moveTo(18 * scale, -74);
        ctx.lineTo(32 * scale, -64);
        ctx.stroke();
        // Feet
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(-10 * scale, -6, 12, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(10 * scale, -6, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    {
      id: 'yeti',
      name: 'Yeti',
      type: 'code',
      draw: function(ctx, flipped, aimingData = {}) {
        const scale = flipped ? -1 : 1;
        ctx.save();
        ctx.scale(scale, 1);
        // Fur body
        ctx.fillStyle = '#E3F2FD';
        ctx.beginPath();
        ctx.ellipse(0, -58, 30, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        // Fur tufts
        ctx.fillStyle = '#BBDEFB';
        ctx.beginPath();
        ctx.ellipse(-24 * scale, -50, 10, 14, 0.4, 0, Math.PI * 2);
        ctx.ellipse(24 * scale, -50, 10, 14, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#F5FBFF';
        ctx.beginPath();
        ctx.arc(0, -108, 22, 0, Math.PI * 2);
        ctx.fill();
        // Face patch
        ctx.fillStyle = '#CFE8F7';
        ctx.beginPath();
        ctx.ellipse(2 * scale, -104, 15, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#0D47A1';
        ctx.beginPath();
        ctx.arc(-6 * scale, -110, 4, 0, Math.PI * 2);
        ctx.arc(8 * scale, -110, 4, 0, Math.PI * 2);
        ctx.fill();
        // Mouth with fangs
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(1 * scale, -98, 6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(-3 * scale, -97);
        ctx.lineTo(-1 * scale, -92);
        ctx.lineTo(1 * scale, -97);
        ctx.closePath();
        ctx.fill();
        // Horns
        ctx.fillStyle = '#B0BEC5';
        ctx.beginPath();
        ctx.moveTo(-14 * scale, -124);
        ctx.lineTo(-20 * scale, -142);
        ctx.lineTo(-6 * scale, -126);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14 * scale, -124);
        ctx.lineTo(20 * scale, -142);
        ctx.lineTo(6 * scale, -126);
        ctx.closePath();
        ctx.fill();
        // Arms
        ctx.strokeStyle = '#E3F2FD';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(-24 * scale, -72);
        ctx.lineTo(-40 * scale, -92);
        ctx.moveTo(24 * scale, -72);
        ctx.lineTo(40 * scale, -60);
        ctx.stroke();
        // Feet
        ctx.fillStyle = '#BBDEFB';
        ctx.beginPath();
        ctx.ellipse(-12 * scale, -6, 13, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(12 * scale, -6, 13, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  ],
  
  terrains: [
    {
      id: 'city',
      name: 'City',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;

        const minWidth = 80;
        const maxWidth = 130;
        const width = minWidth + Math.random() * (maxWidth - minWidth);

        const smallerBuilding = index <= 1 || index >= 6;

        const minHeight = 40;
        const maxHeight = 300;
        const minHeightGorilla = 30;
        const maxHeightGorilla = 150;

        const height = smallerBuilding
          ? minHeightGorilla + Math.random() * (maxHeightGorilla - minHeightGorilla)
          : minHeight + Math.random() * (maxHeight - minHeight);

        // Generate an array of booleans to show if the light is on or off in a room
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          const light = Math.random() <= 0.33 ? true : false;
          lightsOn.push(light);
        }

        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#F8BA85', '#FFC28E'],
          buildings: '#4A3C68',
          windows: '#EBB6A2'
        },
        dark: {
          sky: ['#27507F', '#58A8D8'],
          buildings: '#152A47',
          windows: '#5F76AB'
        }
      }
    },
    {
      id: 'mountains',
      name: 'Mountains',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        
        const minWidth = 80;
        const maxWidth = 180; // wider mountains
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        
        // Mountains have jagged tops
        let height;
        if (index <= 1 || index >= 6) {
          // Smaller mountains at the edges
          height = 30 + Math.random() * 120;
        } else {
          // Taller mountains in the middle
          height = 120 + Math.random() * 200;
        }
        
        // Simulate snow caps with different colored "windows" at the top
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          // Snow caps on the top 25% of the mountain
          const light = i < 12 ? true : Math.random() <= 0.1;
          lightsOn.push(light);
        }
        
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#78A9FF', '#C2E3FF'],
          buildings: '#6A7583',
          windows: '#FFFFFF' 
        },
        dark: {
          sky: ['#0A1F44', '#284D7E'],
          buildings: '#3D4856',
          windows: '#E1EFFF'
        }
      }
    },
    {
      id: 'futuristic',
      name: 'Futuristic City',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;

        // Futuristic buildings - taller, sleeker
        const minWidth = 60;
        const maxWidth = 100;
        const width = minWidth + Math.random() * (maxWidth - minWidth);

        // Buildings get taller toward the center
        const centerIndex = 4;
        const distFromCenter = Math.abs(index - centerIndex);
        const heightFactor = 1 - (distFromCenter / 10);
        
        const height = 100 + Math.random() * 300 * heightFactor;
        
        // Futuristic buildings have more lights
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          // More lit windows - futuristic feel
          const light = Math.random() <= 0.6 ? true : false;
          lightsOn.push(light);
        }

        // Add a "spire" property for the top of some buildings
        const hasSpire = Math.random() > 0.5;
        const spireHeight = hasSpire ? 20 + Math.random() * 40 : 0;
        
        return { 
          x, 
          width, 
          height, 
          lightsOn,
          hasSpire,
          spireHeight
        };
      },
      colors: {
        light: {
          sky: ['#2C3E50', '#5D6D7E'],
          buildings: '#1B2631',
          windows: '#5DADE2'
        },
        dark: {
          sky: ['#0B0B0D', '#1F2022'],
          buildings: '#17202A',
          windows: '#3498DB'
        }
      }
    },
    {
      id: 'mountain',
      name: 'Mountain Range',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        
        // Mountain peaks vary in width
        const minWidth = 90;
        const maxWidth = 200;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        
        // Create a mountain range with taller peaks in the center
        const centerIndex = 4;
        const distFromCenter = Math.abs(index - centerIndex);
        const heightFactor = 1 - (distFromCenter / 8);
        
        // Dramatic height variation for mountain range
        const height = 100 + Math.random() * 320 * heightFactor;
        
        // Snow caps at the top of mountains
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          // Snow appears at top 20% of the mountain
          const isSnow = i < 10 || (height > 300 && i < 15);
          lightsOn.push(isSnow);
        }
        
        // Add a property for mountain type (rocky, snowy, etc.)
        const mountainType = Math.floor(Math.random() * 3); // 0=rocky, 1=snowy, 2=mixed
        
        return { 
          x, 
          width, 
          height, 
          lightsOn,
          mountainType
        };
      },
      colors: {
        light: {
          sky: ['#87CEEB', '#ADD8E6'],
          buildings: '#8B4513', // Sienna - brownish mountain rock
          windows: '#FFFFFF'  // White snow
        },
        dark: {
          sky: ['#191970', '#000080'], // Midnight blue
          buildings: '#5F4C3B', // Darker brown
          windows: '#E0FFFF'  // Light cyan snow at night
        }
      }
    },
    {
      id: 'sea',
      name: 'Ocean Islands',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        
        // Islands tend to be wider and flatter
        const minWidth = 100;
        const maxWidth = 180;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        
        // Islands have varying heights but are generally lower
        let height;
        if (index <= 1 || index >= 6) {
          // Small islands at edges
          height = 20 + Math.random() * 80;
        } else {
          // Larger islands in the middle
          height = 50 + Math.random() * 150;
        }
        
        // Beach areas and vegetation
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          // Beaches at the base, vegetation at top
          const isBeach = i > 40;
          const isVegetation = i < 20;
          lightsOn.push(isBeach || (isVegetation && Math.random() > 0.6));
        }
        
        return { 
          x, 
          width, 
          height, 
          lightsOn,
          isIsland: true
        };
      },
      colors: {
        light: {
          sky: ['#00BFFF', '#87CEEB'], // Deep sky blue to sky blue
          buildings: '#006400', // Dark green for islands
          windows: '#F5DEB3'  // Wheat color for beaches
        },
        dark: {
          sky: ['#00008B', '#191970'], // Dark blue
          buildings: '#004040', // Dark green-blue
          windows: '#DEB887'  // Burlywood for darker beaches
        }
      }
    },
    {
      id: 'bedrock',
      name: 'Bedrock Caverns',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        
        const minWidth = 70;
        const maxWidth = 140;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        
        // Rugged, varied heights for cave formations
        const height = 60 + Math.random() * 220;
        
        // Generate crystal formations and cave openings
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          // Random crystal formations
          const isCrystal = Math.random() < 0.15;
          // Cave openings more common at the bottom
          const isCaveOpening = i > 35 && Math.random() < 0.3;
          
          lightsOn.push(isCrystal || isCaveOpening);
        }
        
        // Add stalagmites at the top
        const hasStalagmite = Math.random() > 0.5;
        const stalagmiteHeight = hasStalagmite ? 10 + Math.random() * 30 : 0;
        
        return { 
          x, 
          width, 
          height, 
          lightsOn,
          hasStalagmite,
          stalagmiteHeight
        };
      },
      colors: {
        light: {
          sky: ['#1A1110', '#2C2624'], // Very dark brown-black
          buildings: '#696969', // Dim gray for stone
          windows: '#9370DB'  // Medium purple for crystals
        },
        dark: {
          sky: ['#000000', '#0A0A0A'], // Black
          buildings: '#2F4F4F', // Dark slate gray for stone
          windows: '#9400D3'  // Dark violet for crystals
        }
      }
    },
    {
      id: 'desert',
      name: 'Desert',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        // Dunes are wide and low
        const minWidth = 100;
        const maxWidth = 180;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        // Dunes are lower at the edges, higher in the center
        let height;
        if (index <= 1 || index >= 6) {
          height = 20 + Math.random() * 40;
        } else {
          height = 60 + Math.random() * 80;
        }
        // Sand patches
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() > 0.7);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#FFE0A3', '#FFC46B'],
          buildings: '#B5651D',
          windows: '#FFEBC2'
        },
        dark: {
          sky: ['#2B1B12', '#7A4B2A'],
          buildings: '#4A2C1A',
          windows: '#FFB74D'
        }
      }
    },
    {
      id: 'candyland',
      name: 'Candyland',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        // Candy buildings are colorful and varied
        const minWidth = 70;
        const maxWidth = 120;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        let height;
        if (index <= 1 || index >= 6) {
          height = 40 + Math.random() * 60;
        } else {
          height = 80 + Math.random() * 120;
        }
        // Candy windows (gumdrops)
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() > 0.5);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#FFB6F9', '#FFD6E0'],
          buildings: '#FF69B4',
          windows: '#FFF176'
        },
        dark: {
          sky: ['#8E24AA', '#F06292'],
          buildings: '#BA68C8',
          windows: '#FFF176'
        }
      }
    },
    {
      id: 'neon',
      name: 'Neon City',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        const minWidth = 45;
        const maxWidth = 85;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const tallTower = index > 1 && index < 6;
        const height = tallTower
          ? 160 + Math.random() * 140
          : 45 + Math.random() * 90;
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() < 0.55);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#4A0F6B', '#FF6EC7'],
          buildings: '#1B0B2E',
          windows: '#00E5FF'
        },
        dark: {
          sky: ['#12001F', '#7B1FA2'],
          buildings: '#0A0416',
          windows: '#FF2A6D'
        }
      }
    },
    {
      id: 'jungle',
      name: 'Jungle',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        const minWidth = 85;
        const maxWidth = 145;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const height =
          index <= 1 || index >= 6
            ? 45 + Math.random() * 70
            : 90 + Math.random() * 160;
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() < 0.28);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#B7E4C7', '#F7FFF7'],
          buildings: '#1B4332',
          windows: '#95D5B2'
        },
        dark: {
          sky: ['#081C15', '#2D6A4F'],
          buildings: '#04110C',
          windows: '#52B788'
        }
      }
    },
    {
      id: 'arctic',
      name: 'Arctic',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        const minWidth = 70;
        const maxWidth = 120;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const height =
          index <= 1 || index >= 6
            ? 40 + Math.random() * 80
            : 110 + Math.random() * 150;
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() < 0.2);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#B3E5FC', '#F1FAFF'],
          buildings: '#90A4AE',
          windows: '#E1F5FE'
        },
        dark: {
          sky: ['#06263D', '#1E88A8'],
          buildings: '#12314A',
          windows: '#81D4FA'
        }
      }
    },
    {
      id: 'volcano',
      name: 'Volcano',
      generateBuilding: function(index, previousBuilding) {
        const x = previousBuilding
          ? previousBuilding.x + previousBuilding.width + 4
          : 0;
        const minWidth = 75;
        const maxWidth = 130;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const height =
          index <= 1 || index >= 6
            ? 50 + Math.random() * 70
            : 130 + Math.random() * 170;
        const lightsOn = [];
        for (let i = 0; i < 50; i++) {
          lightsOn.push(Math.random() < 0.4);
        }
        return { x, width, height, lightsOn };
      },
      colors: {
        light: {
          sky: ['#FF8A65', '#FFD180'],
          buildings: '#3E2723',
          windows: '#FF7043'
        },
        dark: {
          sky: ['#1A0000', '#B71C1C'],
          buildings: '#140A0A',
          windows: '#FFAB40'
        }
      }
    }
  ],
  
  balls: [
    {
      id: 'banana',
      name: 'Banana',
      draw: function(ctx, rotation) {
        ctx.fillStyle = "yellow";
        ctx.save();
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.quadraticCurveTo(0, 12, 8, -2);
        ctx.quadraticCurveTo(0, 2, -8, -2);
        ctx.fill();
        ctx.restore();
      }
    },
    {
      id: 'bomb',
      name: 'Bomb',
      draw: function(ctx, rotation) {
        ctx.fillStyle = "black";
        ctx.save();
        ctx.rotate(rotation);
        // Bomb body (circle)
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuse
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(5, -12, 8, -15);
        ctx.stroke();
        
        // Spark
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(8, -15, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'star',
      name: 'Ninja Star',
      draw: function(ctx, rotation) {
        ctx.fillStyle = "#BBB";
        ctx.save();
        ctx.rotate(rotation);
        
        // Draw four-pointed star
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(0, -10);
          ctx.lineTo(5, -3);
        }
        ctx.closePath();
        ctx.fill();
        
        // Center circle
        ctx.fillStyle = "#666";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'fireball',
      name: 'Fireball',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        
        // Create radial gradient for fire effect
        const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.3, 'yellow');
        gradient.addColorStop(0.6, 'orange');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'rocket',
      name: 'Comet',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        
        // Rocket body
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rocket nose cone
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(16, 0);
        ctx.lineTo(12, 4);
        ctx.lineTo(12, -4);
        ctx.closePath();
        ctx.fill();
        
        // Rocket fins
        ctx.fillStyle = '#FF4500';
        // Top fin
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.lineTo(-13, -10);
        ctx.lineTo(-5, -5);
        ctx.closePath();
        ctx.fill();
        
        // Bottom fin
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.lineTo(-13, 10);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        
        // Rocket exhaust flame
        const gradient = ctx.createLinearGradient(-12, 0, -20, 0);
        gradient.addColorStop(0, 'yellow');
        gradient.addColorStop(0.5, 'orange');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-12, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    },
    {
      id: 'bazooka',
      name: 'Bazooka',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        
        // Shell body
        ctx.fillStyle = '#3A5F0B'; // Military green
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(8, -4);
        ctx.lineTo(8, 4);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        
        // Shell nose
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(12, 0);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();
        
        // Shell stripes
        ctx.strokeStyle = '#F7E017'; // Yellow
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -4);
        ctx.lineTo(-5, 4);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(5, -4);
        ctx.lineTo(5, 4);
        ctx.stroke();
        
        ctx.restore();
      }
    },
    {
      id: 'apple',
      name: 'Apple',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.ellipse(5, -7, 2, 5, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -12);
        ctx.stroke();
        ctx.restore();
      }
    },
    {
      id: 'snowball',
      name: 'Snowball',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.shadowColor = '#b2ebf2';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    },
    {
      id: 'anvil',
      name: 'Anvil',
      draw: function(ctx, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        ctx.fillStyle = '#616161';
        // Base
        ctx.fillRect(-10, 5, 20, 6);
        // Body
        ctx.fillRect(-7, -7, 14, 12);
        // Horn
        ctx.beginPath();
        ctx.moveTo(-7, -7);
        ctx.lineTo(-18, -2);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        // Top
        ctx.fillRect(-12, -12, 24, 6);
        ctx.restore();
      }
    }
  ],
  
  effects: [
    {
      id: 'explosion',
      name: 'Classic Explosion',
      draw: function(ctx, x, y, size, progress) {
        // Simple expanding circle
        const radius = size * progress;
        ctx.fillStyle = `rgba(255, 165, 0, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    {
      id: 'starburst',
      name: 'Starburst',
      draw: function(ctx, x, y, size, progress) {
        const spikes = 12;
        const outerRadius = size * progress;
        const innerRadius = outerRadius * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * 2 * i) / (spikes * 2);
          const pointX = x + Math.cos(angle) * radius;
          const pointY = y + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(pointX, pointY);
          } else {
            ctx.lineTo(pointX, pointY);
          }
        }
        
        ctx.closePath();
        ctx.fill();
      }
    },
    {
      id: 'blood',
      name: 'Blood Splatter',
      draw: function(ctx, x, y, size, progress, options = {}) {
        const particleCount = 25;
        const maxDistance = size * progress * 1.5;
        const direction = options.direction !== undefined ? options.direction : null;
        ctx.fillStyle = `rgba(180, 0, 0, ${1 - progress * 0.8})`;
        for (let i = 0; i < particleCount; i++) {
          // If direction is set, bias the angle toward that direction
          let angle;
          if (direction !== null) {
            // Gaussian bias toward direction
            angle = direction + (Math.random() - 0.5) * Math.PI / 2;
          } else {
            angle = Math.random() * Math.PI * 2;
          }
          const distance = Math.random() * maxDistance * (direction !== null ? (0.7 + 0.6 * Math.random()) : 1);
          const dropSize = 2 + Math.random() * 5 * (1 - progress * 0.5);
          const dropX = x + Math.cos(angle) * distance;
          const dropY = y + Math.sin(angle) * distance;
          ctx.beginPath();
          ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
          ctx.fill();
          if (i % 4 === 0 && progress < 0.7) {
            const dripLength = 5 + Math.random() * 10 * (0.7 - progress);
            ctx.beginPath();
            ctx.moveTo(dropX, dropY);
            ctx.lineTo(dropX, dropY + dripLength);
            ctx.lineWidth = dropSize * 0.8;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
          }
        }
        // Add central splash
        const centralSize = size * 0.6 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, centralSize, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    {
      id: 'pixelated',
      name: 'Pixelated',
      draw: function(ctx, x, y, size, progress) {
        const particleCount = 20;
        const maxDistance = size * progress;
        
        ctx.fillStyle = `rgba(255, 200, 0, ${1 - progress})`;
        
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * maxDistance;
          const particleSize = 2 + Math.random() * 5;
          
          const particleX = x + Math.cos(angle) * distance;
          const particleY = y + Math.sin(angle) * distance;
          
          ctx.fillRect(
            particleX - particleSize / 2, 
            particleY - particleSize / 2, 
            particleSize, 
            particleSize
          );
        }
      }
    },
    {
      id: 'shockwave',
      name: 'Shockwave',
      draw: function(ctx, x, y, size, progress) {
        const radius = size * progress;
        const ringWidth = 5;
        
        // Draw shockwave as a ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
        ctx.lineWidth = ringWidth * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Optional inner glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.7);
        gradient.addColorStop(0, `rgba(255, 200, 100, ${0.5 * (1 - progress)})`);
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  ]
};

// Helper function for rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
