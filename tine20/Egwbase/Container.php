<?php
/**
 * eGroupWare 2.0
 * 
 * @package     Egwbase
 * @subpackage  Acl
 * @license     http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * @copyright   Copyright (c) 2007-2007 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @version     $Id: $
 */

/**
 * this class handles access rights(grants) to containers
 * 
 * any record in eGroupWare 2.0 is tied to a container. the rights of an account on a record gets 
 * calculated by the grants given to this account on the container holding the record (if you know what i mean ;-))
 */
class Egwbase_Container
{
    /**
     * the table object for the egw_container table
     *
     * @var Zend_Db_Table_Abstract
     */
    protected $containerTable;

    /**
     * the table object for the egw_container_acl table
     *
     * @var Zend_Db_Table_Abstract
     */
    protected $containerAclTable;

    /**
     * constant for no grants
     *
     */
    const GRANT_NONE = 0;

    /**
     * constant for read grant
     *
     */
    const GRANT_READ = 1;

    /**
     * constant for add grant
     *
     */
    const GRANT_ADD = 2;

    /**
     * constant for edit grant
     *
     */
    const GRANT_EDIT = 4;

    /**
     * constant for delete grant
     *
     */
    const GRANT_DELETE = 8;

    /**
     * constant for admin grant
     *
     */
    const GRANT_ADMIN = 16;

    /**
     * constant for all grants
     *
     */
    const GRANT_ANY = 31;
    
    /**
     * type for internal contaier
     * 
     * for example the internal addressbook
     *
     */
    const TYPE_INTERNAL = 'internal';
    
    /**
     * type for personal containers
     *
     */
    const TYPE_PERSONAL = 'personal';
    
    /**
     * type for shared container
     *
     */
    const TYPE_SHARED = 'shared';
    
    /**
     * the constructor
     *
     * until we have finnished the table setup infrastructure, we also create the 
     * needed tables in this class on demand
     */
    private function __construct() {
        try {
            $this->containerTable = new Egwbase_Db_Table(array('name' => 'egw_container'));
        } catch (Zend_Db_Statement_Exception $e) {
            $this->createContainerTable();
            $this->containerTable = new Egwbase_Db_Table(array('name' => 'egw_container'));

            $application = Egwbase_Application::getInstance()->getApplicationByName('addressbook');
            
            $data = array(
                'container_name'    => 'Internal Contacts',
                'container_type'    => self::TYPE_INTERNAL,
                'container_backend' => Addressbook_Backend::SQL,
                'application_id'    => $application->app_id
            );
            $this->containerTable->insert($data);

            $data = array(
                'container_name'    => 'Personal Contacts',
                'container_type'    => self::TYPE_PERSONAL,
                'container_backend' => Addressbook_Backend::SQL,
                'application_id'    => $application->app_id
            );
            $this->containerTable->insert($data);
            
            $data = array(
                'container_name'    => 'Shared Contacts',
                'container_type'    => self::TYPE_SHARED,
                'container_backend' => Addressbook_Backend::SQL,
                'application_id'    => $application->app_id
            );
            $this->containerTable->insert($data);
        }
        
        try {
            $this->containerAclTable = new Egwbase_Db_Table(array('name' => 'egw_container_acl'));
        } catch (Zend_Db_Statement_Exception $e) {
            $this->createContainerAclTable();
            $this->containerAclTable = new Egwbase_Db_Table(array('name' => 'egw_container_acl'));

            $application = Egwbase_Application::getInstance()->getApplicationByName('addressbook');
            $accountId = Zend_Registry::get('currentAccount')->account_id;
            
            $data = array(
                'container_id'   => 1,
                'account_id'     => NULL,
                'account_grant'  => self::GRANT_READ
            );
            $this->containerAclTable->insert($data);

            foreach(array(self::GRANT_ADD, self::GRANT_ADMIN, self::GRANT_DELETE, self::GRANT_EDIT, self::GRANT_READ) as $grant) {
                $data = array(
                    'container_id'   => 2,
                    'account_id'     => $accountId,
                    'account_grant'  => $grant
                );
                $this->containerAclTable->insert($data);
            }
            
            foreach(array(self::GRANT_ADD, self::GRANT_ADMIN, self::GRANT_DELETE, self::GRANT_EDIT, self::GRANT_READ) as $grant) {
                $data = array(
                    'container_id'   => 3,
                    'account_id'     => $accountId,
                    'account_grant'  => $grant
                );
                $this->containerAclTable->insert($data);
            }
        }
    }
    /**
     * don't clone. Use the singleton.
     *
     */
    private function __clone() {}

    /**
     * holdes the instance of the singleton
     *
     * @var Egwbase_Container
     */
    private static $instance = NULL;
    
    /**
     * the singleton pattern
     *
     * @return Egwbase_Container
     */
    public static function getInstance() 
    {
        if (self::$instance === NULL) {
            self::$instance = new Egwbase_Container;
        }
        
        return self::$instance;
    }

    /**
     * temporary function to create the egw_container table on demand
     *
     */
    protected function createContainerTable() {
        $db = Zend_Registry::get('dbAdapter');
        
        try {
            $tableData = $db->describeTable('egw_container');
        } catch (Zend_Db_Statement_Exception $e) {
            // table does not exist
            $result = $db->getConnection()->exec("CREATE TABLE egw_container (
            	container_id int(11) NOT NULL auto_increment, 
            	container_name varchar(256), 
            	container_type enum('personal', 'shared', 'internal') NOT NULL,
            	container_backend varchar(64) NOT NULL,
            	application_id int(11) NOT NULL,
            	PRIMARY KEY  (`container_id`),
            	KEY `egw_container_container_type` (`container_type`),
            	KEY `egw_container_container_application_id` (`application_id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8"
            );
        }
    }

    /**
     * temporary function to create the egw_container_acl table on demand
     *
     */
    protected function createContainerAclTable() {
        $db = Zend_Registry::get('dbAdapter');
        
        try {
            $tableData = $db->describeTable('egw_container_acl');
        } catch (Zend_Db_Statement_Exception $e) {
            // table does not exist
            $result = $db->getConnection()->exec("CREATE TABLE egw_container_acl (
                acl_id int(11) NOT NULL auto_increment,
            	container_id int(11) NOT NULL, 
            	account_id int(11),
            	account_grant int(11) NOT NULL,
            	PRIMARY KEY (`acl_id`),
            	UNIQUE KEY `egw_container_acl_primary` (`container_id`, `account_id`, `account_grant`),
            	KEY `egw_container_acl_account_id` (`account_id`)
            	) ENGINE=InnoDB DEFAULT CHARSET=utf8"
            );
        }
    }
    
    /**
     * creates a new container
     *
     * @param string $_application the name of the application
     * @param string $_name the name of the container
     * @param int $_type the type of the container(Egwbase_Container::TYPE_SHARED, Egwbase_Container::TYPE_PERSONAL. Egwbase_Container::TYPE_INTERNAL)
     * @param string $_backend type of the backend. for eaxmple: sql, ldap, ...
     * @return int the id of the newly create container
     */
    public function addContainer($_application, $_name, $_type, $_backend)
    {
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);
        
        $data = array(
            'container_name'    => $_name,
            'container_type'    => $_type,
            'container_backend' => $_backend,
            'application_id'    => $application->app_id
        );
        $containerId = $this->containerTable->insert($data);
        
        if($containerId < 1) {
            throw new UnexpectedValueException('$containerId can not be 0');
        }
        
        return $containerId;
    }
    
    /**
     * add grants to container
     *
     * @param int $_containerId
     * @param int $_accountId
     * @param array $_grants list of grants to add
     * @return boolean
     */
    public function addGrants($_containerId, $_accountId, array $_grants)
    {
        $containerId = (int)$_containerId;
        if($containerId != $_containerId) {
            throw new InvalidArgumentException('$_containerId must be integer');
        }
        
        if($_accountId !== NULL) {
            $accountId = (int)$_accountId;
            if($accountId != $_accountId) {
                throw new InvalidArgumentException('$_accountId must be integer or NULL');
            }
        } else {
            $accountId = NULL;
        }
        
        $grants = (int)$_grants;
        
        foreach($_grants as $grant) {
            $grant = (int)$grant;
            
            if($grant === 0 || $grant > self::GRANT_ADMIN) {
                throw new InvalidArgumentException('$_grant must be integer and can not be greater then ' . self::GRANT_ADMIN);
            }
            if($grant > 1 && $grant % 2 !== 0) {
                throw new InvalidArgumentException('you can only set one grant(1,2,4,8,...) at once');
            }
            
            $data = array(
                'container_id'   => $containerId,
                'account_id'     => $accountId,
                'account_grant'  => $grant
            );
            $this->containerAclTable->insert($data);
        }
                        
        return true;
    }
    
    /**
     * returns the internal conatainer for a given application
     *
     * @param string $_application name of the application
     * @return Egwbase_Record_Container the internal container
     */
    public function getInternalContainer($_application)
    {
        $accountId   = Zend_Registry::get('currentAccount')->account_id;
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);
        
        $db = Zend_Registry::get('dbAdapter');

        $select = $db->select()
            ->from('egw_container_acl', array('account_grants' => 'BIT_OR(egw_container_acl.account_grant)'))
            ->join('egw_container', 'egw_container_acl.container_id = egw_container.container_id')
            ->where('egw_container_acl.account_id IN (?) OR egw_container_acl.account_id IS NULL', $accountId)
            ->where('egw_container.container_type = ?', self::TYPE_INTERNAL)
            ->where('egw_container.application_id = ?', $application->app_id)
            ->group('egw_container.container_id')
            ->having('account_grants & ?', self::GRANT_READ)
            ->order('egw_container.container_name');
            
        //error_log("getInternalContainer:: " . $select->__toString());

        $stmt = $db->query($select);
        $result = new Egwbase_Record_Container($stmt->fetch(Zend_Db::FETCH_ASSOC), true);
        
        if(empty($result)) {
            throw new Exception('internal container not found or not accessible');
        }

        return $result;
        
    }
    
    /**
     * return all container, which the user has the requested right for
     *
     * used to get a list of all containers accesssible by the current user
     * 
     * @param int $_accountId
     * @param string $_application the application name
     * @param int $_right the required right
     * @return Egwbase_Record_RecordSet
     */
    public function getContainerByACL($_accountId, $_application, $_right)
    {
        $accountId = (int)$_accountId;
        if($accountId != $_accountId) {
            throw new InvalidArgumentException('$_accountId must be integer');
        }
        
        $right = (int)$_right;
        if($right != $_right) {
            throw new InvalidArgumentException('$_right must be integer');
        }
        
        $groupMemberships   = Egwbase_Account::getBackend()->getGroupMemberships($accountId);
        $groupMemberships[] = $accountId;
        
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);
               
        $db = Zend_Registry::get('dbAdapter');
        
        $select = $db->select()
            ->from('egw_container')
            ->join(
                'egw_container_acl',
                'egw_container.container_id = egw_container_acl.container_id', 
                array('account_grants' => 'BIT_OR(egw_container_acl.account_grant)')
            )
            ->where('egw_container.application_id = ?', $application->app_id)
            ->where('egw_container_acl.account_id IN (?) OR egw_container_acl.account_id IS NULL', $groupMemberships)
            ->group('egw_container.container_id')
            ->having('account_grants & ?', $right)
            ->order('egw_container.container_name');

        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);

        $result = new Egwbase_Record_RecordSet($stmt->fetchAll(Zend_Db::FETCH_ASSOC), 'Egwbase_Record_Container');
        
        return $result;
    }
    
    /**
     * return a container by containerId
     *
     * @param int $_containerId the id of the container
     * @return Egwbase_Record_Container
     */
    public function getContainerById($_containerId)
    {
        $containerId = (int)$_containerId;
        if($containerId != $_containerId) {
            throw new InvalidArgumentException('$_containerId must be integer');
        }
        
        $accountId = Zend_Registry::get('currentAccount')->account_id;
        
        $groupMemberships   = Zend_Registry::get('currentAccount')->getGroupMemberships();
        $groupMemberships[] = $accountId;
        

        if(!$this->hasGrant($accountId, $containerId, self::GRANT_READ)) {
            throw new Exception('permission to container denied');
        }
        
        $db = Zend_Registry::get('dbAdapter');
        
        $select = $db->select()
            ->from('egw_container')
            ->join(
                'egw_container_acl',
                'egw_container.container_id = egw_container_acl.container_id', 
                array('account_grants' => 'BIT_OR(egw_container_acl.account_grant)')
            )
            ->where('egw_container.container_id = ?', $containerId)
            ->where('egw_container_acl.account_id IN (?) OR egw_container_acl.account_id IS NULL', $groupMemberships)
            ->group('egw_container.container_id')
            ->order('egw_container.container_name');

        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);
        $result = new Egwbase_Record_Container($stmt->fetch(Zend_Db::FETCH_ASSOC));
        
        if(empty($result)) {
            throw new UnderflowException('container not found');
        }
        
        return $result;
        
    }
    
    /**
     * returns the personal container of a given account accessible by the current user
     *
     * @param string $_application the name of the application
     * @param int $_owner the numeric account id of the owner
     * @return Egwbase_Record_RecordSet set of Egwbase_Record_Container
     */
    public function getPersonalContainer($_application, $_owner)
    {
        $owner = (int)$_owner;
        if($owner != $_owner) {
            throw new InvalidArgumentException('$_owner must be integer');
        }
        
        $groupMemberships   = Zend_Registry::get('currentAccount')->getGroupMemberships();
        $groupMemberships[] = Zend_Registry::get('currentAccount')->account_id;
        
        $db = Zend_Registry::get('dbAdapter');
        
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);

        $select = $db->select()
            ->from(array('owner' => 'egw_container_acl'), array())
            ->join(
                array('user' => 'egw_container_acl'),
                'owner.container_id = user.container_id', 
                array('account_grants' => 'BIT_OR(user.account_grant)')
            )
            ->join('egw_container', 'owner.container_id = egw_container.container_id')
            ->where('owner.account_id = ?', $_owner)
            ->where('owner.account_grant = ?', self::GRANT_ADMIN)
            ->where('user.account_id IN (?) OR user.account_id IS NULL', $groupMemberships)
            ->where('egw_container.application_id = ?', $application->app_id)
            ->where('egw_container.container_type = ?', self::TYPE_PERSONAL)
            ->group('egw_container.container_id')
            ->having('account_grants & ?', self::GRANT_READ)
            ->order('egw_container.container_name');
            
        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);

        $result = new Egwbase_Record_RecordSet($stmt->fetchAll(Zend_Db::FETCH_ASSOC), 'Egwbase_Record_Container');
        
        return $result;
    }
    
    /**
     * returns the shared container for a given application accessible by the current user
     *
     * @param string $_application the name of the application
     * @return Egwbase_Record_RecordSet set of Egwbase_Record_Container
     */
    public function getSharedContainer($_application)
    {
        $groupMemberships   = Zend_Registry::get('currentAccount')->getGroupMemberships();
        $groupMemberships[] = Zend_Registry::get('currentAccount')->account_id;
        
        $db = Zend_Registry::get('dbAdapter');
        
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);

        $select = $db->select()
            ->from('egw_container_acl', array('account_grants' => 'BIT_OR(egw_container_acl.account_grant)'))
            ->join('egw_container', 'egw_container_acl.container_id = egw_container.container_id')
            ->where('egw_container_acl.account_id IN (?) OR egw_container_acl.account_id IS NULL', $groupMemberships)
            ->where('egw_container.application_id = ?', $application->app_id)
            ->where('egw_container.container_type = ?', self::TYPE_SHARED)
            ->group('egw_container.container_id')
            ->having('account_grants & ?', self::GRANT_READ)
            ->order('egw_container.container_name');
            
        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);

        $result = new Egwbase_Record_RecordSet($stmt->fetchAll(Zend_Db::FETCH_ASSOC), 'Egwbase_Record_Container');
        
        return $result;
    }
    
    /**
     * return users which made personal containers accessible to current account
     *
     * @param string $_application the name of the application
     * @return array list of accountids
     */
    public function getOtherUsers($_application)
    {
        $accountId = Zend_Registry::get('currentAccount')->account_id;
        
        $groupMemberships   = Zend_Registry::get('currentAccount')->getGroupMemberships();
        $groupMemberships[] = Zend_Registry::get('currentAccount')->account_id;
        
        $db = Zend_Registry::get('dbAdapter');
        
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);

        $select = $db->select()
            ->from(array('owner' => 'egw_container_acl'), array('account_id'))
            ->join(array('user' => 'egw_container_acl'),'owner.container_id = user.container_id', array())
            ->join('egw_container', 'user.container_id = egw_container.container_id', array())
            ->where('owner.account_id != ?', $accountId)
            ->where('owner.account_grant = ?', self::GRANT_ADMIN)
            ->where('user.account_id IN (?) OR user.account_id IS NULL', $groupMemberships)
            ->where('user.account_grant = ?', self::GRANT_READ)
            ->where('egw_container.application_id = ?', $application->app_id)
            ->where('egw_container.container_type = ?', self::TYPE_PERSONAL)
            ->order('egw_container.container_name')
            ->group('owner.account_id');
            
        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);
        $result = $stmt->fetchAll(Zend_Db::FETCH_ASSOC);
        
        if(empty($result)) {
            throw new UnderflowException('no other users found');
        }

        
        
        return $result;
    }
    
    /**
     * return set of all personal container of other users made accessible to the current account 
     *
     * @param string $_application the name of the application
     * @return Egwbase_Record_RecordSet set of Egwbase_Record_Container
     */
    public function getOtherUsersContainer($_application)
    {
        $accountId = Zend_Registry::get('currentAccount')->account_id;
        
        $groupMemberships   = Zend_Registry::get('currentAccount')->getGroupMemberships();
        $groupMemberships[] = Zend_Registry::get('currentAccount')->account_id;
        
        $db = Zend_Registry::get('dbAdapter');
        
        $application = Egwbase_Application::getInstance()->getApplicationByName($_application);

        $select = $db->select()
            ->from(array('owner' => 'egw_container_acl'), array())
            ->join(
                array('user' => 'egw_container_acl'),
                'owner.container_id = user.container_id', 
                array('account_grants' => 'BIT_OR(user.account_grant)'))
            ->join('egw_container', 'user.container_id = egw_container.container_id')
            ->where('owner.account_id != ?', $accountId)
            ->where('owner.account_grant = ?', self::GRANT_ADMIN)
            ->where('user.account_id IN (?) or user.account_id IS NULL', $groupMemberships)
            ->where('egw_container.application_id = ?', $application->app_id)
            ->where('egw_container.container_type = ?', self::TYPE_PERSONAL)
            ->group('egw_container.container_id')
            ->having('account_grants & ?', self::GRANT_READ)
            ->order('egw_container.container_name');
            
        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);

        $result = new Egwbase_Record_RecordSet($stmt->fetchAll(Zend_Db::FETCH_ASSOC), 'Egwbase_Record_Container');
        
        return $result;
    }
    
    /**
     * delete container if user has the required right
     *
     * @param int $_containerId
     */
    public function deleteContainer($_containerId)
    {
        $accountId = Zend_Registry::get('currentAccount')->account_id;
        
        if (!$this->hasGrant($accountId, $_containerId, self::GRANT_ADMIN)) {
            throw new Exception('admin permission to container denied');
        }
        
        $where = array(
            $this->containerTable->getAdapter()->quoteInto('container_id = ?', (int)$_containerId)
        );
        
        $this->containerTable->delete($where);
        $this->containerAclTable->delete($where);
    }
    
    /**
     * rename container, if the user has the required right
     *
     * @param int $_containerId
     * @param string $_containerName the new name
     */
    public function renameContainer($_containerId, $_containerName)
    {
        $accountId = Zend_Registry::get('currentAccount')->account_id;
        
        if (!$this->hasGrant($accountId, $_containerId, self::GRANT_ADMIN)) {
            throw new Exception('admin permission to container denied');
        }
        
        $where = array(
            $this->containerTable->getAdapter()->quoteInto('container_id = ?', (int)$_containerId)
        );
        
        $data = array(
            'container_name' => $_containerName
        );
        
        $this->containerTable->update($data, $where);
    }
    
    /**
     * check if the given user user has a certain grant
     *
     * @param int $_accountId
     * @param int $_containerId
     * @param int $_grant
     * @return boolean
     */
    public function hasGrant($_accountId, $_containerId, $_grant) 
    {
        $accountId = (int)$_accountId;
        if($accountId != $_accountId) {
            throw new InvalidArgumentException('$_accountId must be integer');
        }
        
        $containerId = (int)$_containerId;
        if($containerId != $_containerId) {
            throw new InvalidArgumentException('$_containerId must be integer');
        }
        
        $grant = (int)$_grant;
        if($grant != $_grant) {
            throw new InvalidArgumentException('$_grant must be integer');
        }
        
        $groupMemberships   = Egwbase_Account::getBackend()->getGroupMemberships($accountId);
        $groupMemberships[] = $accountId;
        
        $db = Zend_Registry::get('dbAdapter');

        $select = $db->select()
            ->from('egw_container_acl', array('container_id'))
            ->join('egw_container', 'egw_container_acl.container_id = egw_container.container_id', array())
            ->where('egw_container_acl.account_id IN (?) OR egw_container_acl.account_id IS NULL', $groupMemberships)
            ->where('egw_container_acl.account_grant = ?', $grant)
            ->where('egw_container.container_id = ?', $containerId);
                    
        //error_log("getContainer:: " . $select->__toString());

        $stmt = $db->query($select);
        
        $grants = $stmt->fetchAll(Zend_Db::FETCH_ASSOC);
        if(empty($grants)) {
            return FALSE;
        } else {
            return TRUE;
        }
    }
}