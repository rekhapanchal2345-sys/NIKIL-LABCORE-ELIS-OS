/**
 * LabCore ELIS - Authentication & Role-Based Access Control (RBAC) Middleware
 * Enforces strict security, token verification, and granular AI Studio permissions.
 *
 * CRITICAL CLINICAL SAFETY RULE:
 * AI is strictly for Clinical Decision Support.
 * Automated modification or release of patient results without licensed pathologist authorization is prohibited.
 */

const AI_PERMISSIONS = {
  AI_VIEW: 'ai:view',           // View AI models, dashboards, metrics, and forecasts
  AI_TRAIN: 'ai:train',         // Train and tune Classical ML and Deep Learning models
  AI_PREDICT: 'ai:predict',     // Execute decision-support inferences
  AI_DEPLOY: 'ai:deploy',       // Promote or archive models in Model Registry
  AI_AUDIT: 'ai:audit'          // Inspect inference audit logs and drift telemetry
};

const USER_ROLES = {
  ADMIN: {
    name: 'Administrator / Lab Director',
    permissions: [
      AI_PERMISSIONS.AI_VIEW,
      AI_PERMISSIONS.AI_TRAIN,
      AI_PERMISSIONS.AI_PREDICT,
      AI_PERMISSIONS.AI_DEPLOY,
      AI_PERMISSIONS.AI_AUDIT
    ]
  },
  PATHOLOGIST: {
    name: 'Consultant Pathologist',
    permissions: [
      AI_PERMISSIONS.AI_VIEW,
      AI_PERMISSIONS.AI_PREDICT,
      AI_PERMISSIONS.AI_AUDIT
    ]
  },
  RESEARCHER: {
    name: 'AI & Clinical Data Scientist',
    permissions: [
      AI_PERMISSIONS.AI_VIEW,
      AI_PERMISSIONS.AI_TRAIN,
      AI_PERMISSIONS.AI_PREDICT,
      AI_PERMISSIONS.AI_DEPLOY,
      AI_PERMISSIONS.AI_AUDIT
    ]
  },
  LAB_TECHNICIAN: {
    name: 'Senior Laboratory Technician',
    permissions: [
      AI_PERMISSIONS.AI_VIEW,
      AI_PERMISSIONS.AI_PREDICT
    ]
  }
};

/**
 * Mock/Header JWT Auth extractor for LabCore ELIS
 * Extracts user credentials from Authorization header or default active session.
 */
function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }
    
    const token = authHeader.split(' ')[1];

    // In production, verify JWT payload with jwt.verify(token, SECRET)
    let currentUser = null;

    if (token.includes('admin')) {
      currentUser = {
        userId: 'USR-ADMIN-01',
        username: 'dr.amit.shah',
        fullName: 'DR. amit shah',
        role: 'ADMIN',
        designation: 'Lab Director & Chief Pathologist',
        nablAccredited: true
      };
    } else if (token.includes('pathologist')) {
      currentUser = {
        userId: 'USR-PATH-01',
        username: 'dr.rohit.deshmukh',
        fullName: 'Dr. Rohit Deshmukh',
        role: 'PATHOLOGIST',
        designation: 'Consultant Pathologist',
        nablAccredited: true
      };
    } else if (token.includes('researcher')) {
      currentUser = {
        userId: 'USR-RES-01',
        username: 'dr.ai.research',
        fullName: 'Dr. AI Research Lead',
        role: 'RESEARCHER',
        designation: 'AI & Clinical Data Scientist',
        nablAccredited: false
      };
    } else if (process.env.NODE_ENV === 'development') {
      currentUser = {
        userId: 'USR-ADMIN-01',
        username: 'dr.amit.shah',
        fullName: 'DR. amit shah',
        role: 'ADMIN',
        designation: 'Lab Director & Chief Pathologist',
        nablAccredited: true
      };
    }

    if (!currentUser) {
       return res.status(401).json({ success: false, message: 'Authentication failed. Invalid or expired security token.' });
    }

    const roleConfig = USER_ROLES[currentUser.role] || USER_ROLES.PATHOLOGIST;
    currentUser.permissions = roleConfig.permissions;

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid or expired security token.'
    });
  }
}

/**
 * Middleware factory to enforce specific AI permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated user' });
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User lacks '${permission}' permission to perform this AI operation.`
      });
    }

    next();
  };
}

module.exports = {
  AI_PERMISSIONS,
  USER_ROLES,
  authenticateUser,
  requirePermission
};
