<?php
/**
 * Tine 2.0 - this file starts the setup process
 *
 * @package     Tinebase
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @copyright   Copyright (c) 2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id$
 *
 */
define ( 'DO_TABLE_SETUP', TRUE );
define ( 'IMPORT_EGW_14', FALSE );
define ( 'IMPORT_TINE_REV_949', FALSE );

/**
 * initialize autoloader
 */
require_once 'Zend/Loader.php';

Zend_Loader::registerAutoload();

/**
 * validate environemnt
 */
$check = new Setup_ExtCheck('Setup/essentials.xml');

$output = $check->getOutput();
echo $output;

if (strpos($output, "FAILURE")) {
    die("Unsufficent server system.");
}

/**
 * load central configuration once and put it in the registry
 */
try {
    Zend_Registry::set('configFile', new Zend_Config_Ini($_SERVER['DOCUMENT_ROOT'] . '/../config.ini'));
} catch (Zend_Config_Exception $e) {
    die ('central configuration file ' . $_SERVER['DOCUMENT_ROOT'] . '/../config.ini not found');
}

/**
 * start setup
 */
$setup = new Setup_Tables();
$kindOfSetup = 'initalLoad';
    
if ( DO_TABLE_SETUP === TRUE ) {
    $fileName = 'Tinebase/Setup/setup.xml';
    if(file_exists($fileName)) {
        echo "Processing tables definitions for <b>Tinebase</b>($fileName)<br>";
        $kindOfSetup = $setup->parseFile($fileName);
    }
    
    foreach ( new DirectoryIterator('./') as $item ) {
    	if($item->isDir() && $item->getFileName() != 'Tinebase') {
    		$fileName = $item->getFileName() . '/Setup/setup.xml';
    		if(file_exists($fileName)) {
    			echo "Processing tables definitions for <b>" . $item->getFileName() . "</b>($fileName)<br>";
    			$setup->parseFile($fileName);
    		}
    	}
    }
}


# either import data from eGroupWare 1.4 or tine 2.0 revision 949
if ( IMPORT_EGW_14 === TRUE ) {
    $import = new Setup_Import_Egw14();
    $import->import();

    exit();
} elseif ( IMPORT_TINE_REV_949 === TRUE ) {
    $import = new Setup_Import_TineRev949();
    $import->import();

    exit();
}

if ($kindOfSetup == 'initialLoad')
{
    echo "Creating initial user(tine20amdin) and groups...<br>";
	# or initialize the database ourself
	# add the admin group
	$groupsBackend = Tinebase_Group_Factory::getBackend(Tinebase_Group_Factory::SQL);

	$adminGroup = new Tinebase_Group_Model_Group(array(
	    'name'          => 'Administrators',
	    'description'   => 'Group of administrative accounts'
	));
	$adminGroup = $groupsBackend->addGroup($adminGroup);

	# add the user group
	$userGroup = new Tinebase_Group_Model_Group(array(
	    'name'          => 'Users',
	    'description'   => 'Group of user accounts'
	));
	$userGroup = $groupsBackend->addGroup($userGroup);

	# add the admin account
	$accountsBackend = Tinebase_Account_Factory::getBackend(Tinebase_Account_Factory::SQL);

	$account = new Tinebase_Account_Model_FullAccount(array(
	    'accountLoginName'      => 'tine20admin',
	    'accountStatus'         => 'enabled',
	    'accountPrimaryGroup'   => $userGroup->getId(),
	    'accountLastName'       => 'Account',
	    'accountDisplayName'    => 'Tine 2.0 Admin Account',
	    'accountFirstName'      => 'Tine 2.0 Admin'
	));

	$accountsBackend->addAccount($account);

	Zend_Registry::set('currentAccount', $account);

	# set the password for the tine20admin account
	Tinebase_Auth::getInstance()->setPassword('tine20admin', 'lars', 'lars');

	# add the admin account to all groups
	Tinebase_Group::getInstance()->addGroupMember($adminGroup, $account);
	Tinebase_Group::getInstance()->addGroupMember($userGroup, $account);

	# enable the applications for the user group
	# give admin rights to the admin group for all applications
	$applications = Tinebase_Application::getInstance()->getApplications();
	foreach( $applications as $application) {
	    
	    //@todo    use 'right' field with const from Tinebase_Acl_Rights
        if(strtolower($application->name) !== 'admin') {
            // run right for user group
            $right = new Tinebase_Acl_Model_Right(array(
                'application_id'    => $application->getId(),
                'account_id'        => $userGroup->getId(),
                'account_type'      => 'group',
                'right'             => Tinebase_Acl_Rights::RUN
            ));
            Tinebase_Acl_Rights::getInstance()->addRight($right);
            
            // run for admin group
            $right->account_id = $adminGroup->getId();            
            Tinebase_Acl_Rights::getInstance()->addRight($right);
            
            // admin for admin group
            $right->right = Tinebase_Acl_Rights::ADMIN;            
            Tinebase_Acl_Rights::getInstance()->addRight($right);
            
        } else {
            // run right for admin group
            $right = new Tinebase_Acl_Model_Right(array(
                'application_id'    => $application->getId(),
                'account_id'        => $adminGroup->getId(),
                'account_type'      => 'group',
                'right'             => Tinebase_Acl_Rights::RUN
            ));
            Tinebase_Acl_Rights::getInstance()->addRight($right);
            
            // admin for admin group
            $right->right = Tinebase_Acl_Rights::ADMIN;     
            Tinebase_Acl_Rights::getInstance()->addRight($right);            
	    }
	}

	# give Users group read rights to the internal addressbook
	# give Adminstrators group read/write rights to the internal addressbook
	$internalAddressbook = Tinebase_Container::getInstance()->getContainerByName('Addressbook', 'Internal Contacts', Tinebase_Container::TYPE_INTERNAL);
	Tinebase_Container::getInstance()->addGrants($internalAddressbook, 'group', $userGroup, array(
	    Tinebase_Container::GRANT_READ
	), TRUE);
	Tinebase_Container::getInstance()->addGrants($internalAddressbook, 'group', $adminGroup, array(
	    Tinebase_Container::GRANT_READ,
	    Tinebase_Container::GRANT_ADD,
	    Tinebase_Container::GRANT_EDIT,
	    Tinebase_Container::GRANT_DELETE,
	    Tinebase_Container::GRANT_ADMIN
	), TRUE);
}

echo "setup done!<br>";
