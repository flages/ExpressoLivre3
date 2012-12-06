<?php
/**
 * contacts ldap backend
 * 
 * @package     Addressbook
 * @subpackage  Backend
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3 
 * @author      Cassiano Dal Pizzol <cassiano.dalpizzol@serpro.gov.br> 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2012 SERPRO (http://www.serpro.gov.br)
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * contacts ldap backend
 * 
 * NOTE: LDAP charset is allways UTF-8 (RFC2253) so we don't have to cope with
 *       charset conversions here ;-)
 * 
 * @package     Addressbook
 * @subpackage  Backend
 */
class Addressbook_Backend_Ldap implements Tinebase_Backend_Interface
{
    /**
     * backend type constant
     */
    const TYPE = 'ldap';
    
    /**
     * date representation used by ldap
     */
    const LDAPDATEFORMAT = 'YmdHis';
    
    /**
     * index of the id attribute of the contacts on the LDAP
     */
    const IDCOL = 'id';
    
    /**
     * Default attribute to order on a LDAP Search
     */
    const DEFAULTORDER = 'n_fn';
    
    /**
     * Mas number of results in a ldap search if no maxresults is set  
     */
    const DEFAULTMAXRESULTS = 150;
    
    /**
     * ldap directory connection
     *
     * @var Tinebase_Ldap
     */
    protected $_backend = NULL;
    
    /**
     * options to connect 
     *
     * @var object
     */
    protected $_options = NULL;
    
    /**
     * Default array of options to pagination
     * @var type 
     */
    protected $_defaultPagination = array(
            'filter' => null,
            'start'  => 0,
            'limit'  => 50,
            'sort'   => self::DEFAULTORDER,
            'dir'    => 'DESC',
        );
    
    /**
     *  Array of attributes mapped tine20->ldapattribute
     * @var array
     */
    protected $_attributes = array(        
        'account_id'            => 'uidnumber',
        'adr_one_countryname'   => '',
        'adr_one_locality'      => 'l',
        'adr_one_postalcode'    => 'postalcode',
        'adr_one_region'        => 'st',
        'adr_one_street'        => 'street',
        'adr_one_street2'       => '',
        'adr_one_lon'           => '',
        'adr_one_lat'           => '',
        'adr_two_countryname'   => '',
        'adr_two_locality'      => '',
        'adr_two_postalcode'    => '',
        'adr_two_region'        => '',
        'adr_two_street'        => '',
        'adr_two_street2'       => '',
        'adr_two_lon'           => '',
        'adr_two_lat'           => '',
        'assistent'             => 'assistantname',
        'bday'                  => 'birthdate',
        'calendar_uri'          => 'calendaruri',
        'cat_id'                => 'category',  // special handling in _egw2evolutionperson method
        'email'                 => 'mail',
        'email_home'            => '',
        'employee_number'       => 'employeenumber',
        'geo'                   => '',
        'jpegphoto'             => 'jpegphoto',
        'freebusy_uri'          => 'freeBusyuri',
        'id'                    => 'uid',
        'label'                 => 'postaladdress',
        'container_id'          => '',
        'role'                  => 'businessrole',
        'salutation'            => '',
        'title'                 => 'title',
        'url'                   => 'labeleduri',
        'url_home'              => '',
        'note'                  => 'description',
        'notes'                 => 'note',
        'n_family'              => 'sn',
        'n_fileas'              => 'displayname',
        'n_fileas'              => 'fileas',        
        'n_fn'                  => 'cn',
        'n_given'               => 'givenname',
        'n_middle'              => '',
        'n_prefix'              => '',
        'n_suffix'              => '',
        'org_name'              => 'o',
        'org_unit'              => 'ou',
        'pubkey'                => 'usersmimecertificate',
        'room'                  => 'roomnumber',
        'sound'                 => 'audio',
        'tel_assistent'         => 'assistantphone',
        'tel_car'               => 'carphone',
        'tel_cell'              => 'mobile',
        'tel_cell_private'      => 'callbackphone',
        'tel_fax'               => 'facsimiletelephonenumber',
        'tel_fax_home'          => 'homefacsimiletelephonenumber',
        'tel_home'              => 'homephone',
        'tel_pager'             => 'pager',
        'tel_work'              => 'telephonenumber',
        'tel_other'             => 'otherphone',
        'tel_prefer'            => 'primaryphone',
        'tz'                    => '',

        'created_by'            => 'creatorsname',
        'creation_time'         => 'createtimestamp',
        'last_modified_by'      => 'modifiersname',
        'last_modified_time'    => 'modifytimestamp',
        'is_deleted'            => '',
        'deleted_time'          => '',
        'deleted_by'            => '',
    );
    
    /**
     * constructs a contacts ldap backend
     *
     * @param  array $options Options used in connecting, binding, etc.
     */
    public function __construct(array $_options) 
    {       
        $this->_options = $_options;
        $this->_updateAttributes();
        $this->_backend = new Tinebase_Ldap($_options);
        $this->_backend->bind();
    }
    
    /**
     * Search for records matching given filter
     *
     * @param  Tinebase_Model_Filter_FilterGroup    $_filter
     * @param  Tinebase_Model_Pagination            $_pagination
     * @param  array|string|boolean                 $_cols columns to get, * per default / use self::IDCOL or TRUE to get only ids
     * @return Tinebase_Record_RecordSet
     * 
     * @TODO use the $_cols option
     */
    public function search(Tinebase_Model_Filter_FilterGroup $_filter = NULL, 
                                                            Tinebase_Model_Pagination $_pagination = NULL, $_cols = '*')
    {
        $pagination = $_pagination;
        if (is_null($pagination))
        {
            $pagination = new Tinebase_Model_Pagination($this->_defaultPagination);
        }
        $cache = Tinebase_Core::getCache();
        $cacheId = $this->_getCacheId($_filter);
        $result = $cache->load($cacheId);
        $filter = $this->_decodeFilter($_filter, $pagination);
        if ($result === FALSE)
        {
            Tinebase_Core::getLogger()->debug(__METHOD__ . ':' . __LINE__ . ' Executing LDAP Contact Search' 
                                                                                                   . $filter['filter']);
            $attributes = $this->_generateAttributesArray($_cols);
            $maxresults = $this->_getMaxResults();
            $return = $this->_backend->search($filter['filter'], $this->_options['basedn'], $this->_options['scope'],
                                                                                  $attributes, null, null, $maxresults);
            $result = $this->_ldap2Contacts($return);
            $cache->save($result, $cacheId, array('container', 'ldap'), null);
        }
        $result->sort($filter['sort'], $filter['dir'], 'natcasesort', SORT_REGULAR, true);
        if (!(is_null($_pagination)))
        {
            $result->returnPagination($filter['start'], $filter['limit']);   
        }
        return $result;
    }
    
    /**
     * Gets total count of search with $_filter
     * 
     * @param Tinebase_Model_Filter_FilterGroup $_filter
     * @return int
     * @TODO correct the backend implementation of count (is too slow)
     */
    public function searchCount(Tinebase_Model_Filter_FilterGroup $_filter)
    {
        //$return = $this->_backend->count($filter, $this->_options['basedn'], $this->_options['scope']);
        //return $return;
        $return = count($this->search($_filter));
        return $return;
    }
    
    /**
     * Return a single record
     *
     * @param string $_id
     * @param $_getDeleted get deleted records
     * @return Tinebase_Record_Interface
     */
    public function get($_id, $_getDeleted = FALSE)
    {
        $filter = '(&' .$this->_generateLdapFilter($_id) . $this->_options['filter'] .')';        
        $return = $this->_backend->search($filter, $this->_options['basedn'], $this->_options['scope'], 
                                                                $this->_generateAttributesArray('*'), null, null, 1, 0);
        if (! $return)
        {
            throw new Addressbook_Exception_NotFound('Contact with id ' . $_id . ' not found.');
        }
        $return = $this->_ldap2Contacts($return);
        return $return;
    }
    
    /**
     * Returns a set of records identified by their id's
     * 
     * @param  string|array $_id Ids
     * @param array $_containerIds all allowed container ids that are added to getMultiple query
     * @return Tinebase_RecordSet of Tinebase_Record_Interface
     */
    public function getMultiple($_ids, $_containerIds = NULL)
    {
        $return = NULL;
        if (is_array($_ids))
        {
            $filter = '';
            $idAttribute = $this->_attributes[self::IDCOL];
            foreach ($_ids as $id)
            {
                $filter .= $this->_generateLdapFilter($id, $idAttribute);
            }
            $filter = '(&(|' . $filter . ')' . $this->_options['filter'] .')';
            $arrAttrib = $this->_generateAttributesArray('*');
            $maxresults = $this->_getMaxResults();
            $return = $this->_backend->search($filter, $this->_options['basedn'], $this->_options['scope'], $arrAttrib,
                                                                                               null, null, $maxresults);
            if (! $return)
            {
                throw new Addressbook_Exception_NotFound('Contacts with ids ' . print_r($_ids, true) . ' not found.');
            }
            $return = $this->_ldap2Contacts($return);
        }
        else
        {
            $return = $this->get($_ids);
        }
        return $return;
    }

    /**
     * Gets all entries
     *
     * @param string $_orderBy Order result by
     * @param string $_orderDirection Order direction - allowed are ASC and DESC
     * @throws Tinebase_Exception_InvalidArgument
     * @return Tinebase_Record_RecordSet
     * @TODO: implementation
     */
    public function getAll($_orderBy = 'id', $_orderDirection = 'ASC')
    {
    }
    
    /**
     * Create a new persistent contact
     *
     * @param  Tinebase_Record_Interface $_record
     * @return Tinebase_Record_Interface
     * @TODO: implementation
     */
    public function create(Tinebase_Record_Interface $_record)
    {
        return $_record;
    }
    
    /**
     * Upates an existing persistent record
     *
     * @param  Tinebase_Record_Interface $_contact
     * @return Tinebase_Record_Interface|NULL
     * @TODO: implementation
     */
    public function update(Tinebase_Record_Interface $_record)
    {
        return $_record;
    }
    
    /**
     * Updates multiple entries
     *
     * @param array $_ids to update
     * @param array $_data
     * @return integer number of affected rows
     * @TODO: implementation
     */
    public function updateMultiple($_ids, $_data)
    {
        return 0;
    }

    /**
     * Deletes one or more existing persistent record(s)
     *
     * @param string|array $_identifier
     * @return void
     * @TODO: implementation
     */
    public function delete($_identifier)
    {
    }

    /**
     * get backend type
     *
     * @return string
     */
    public function getType()
    {
        return self::TYPE;
    }

    /**
     * returns contact image
     *
     * @param int $_contactId
     * @return blob
     * @TODO: implementation
     */
    public function getImage($_contactId)
    {
        /*
          $select = $this->_db->select()
            ->from($this->_tablePrefix . 'addressbook_image', array('image'))
            ->where($this->_db->quoteInto($this->_db->quoteIdentifier('contact_id'). ' = ?', $_contactId));
        $rowImageData = $this->_db->fetchRow($select);
        $imageData = $rowImageData['image'];
        
        return $imageData ? base64_decode($imageData) : '';
         
        Tinebase_Core::getLogger()->alert(__METHOD__ . '#####::#####' . __LINE__ . ' contactid ' . $_contactId);
        */
        //$imageData = $rowImageData['image'];
        return NULL;//$imageData ? base64_decode('pegadinha do malandro!') : '';
    }
    
    /*********************************************PROTECTED FUNCTIONS**************************************************/
    /**
     * returns a record set of Addressbook_Model_Contacts filled from raw ldap data
     * 
     * @param  array $_data raw ldap contacts data
     * @return Tinebase_Record_RecordSet of Addressbook_Model_Contacts
     */
    protected function _ldap2Contacts($_data)
    {
        $contacts = array();
        foreach ($_data as $ldapEntry) 
        {            
            $data = array();
            foreach ($this->_attributes as $key=>$value)
            {
                $data[$key] = implode($ldapEntry[$value], ' ');
            }
            $data['container_id']= $this->_options['container'];            
            $this->_setContactImage($data);            
            $contacts[] = new Addressbook_Model_Contact($data, true);
        }
        $contacts = new Tinebase_Record_RecordSet('Addressbook_Model_Contact', $contacts, true, self::LDAPDATEFORMAT);
        return $contacts;
    }
    
    /**
     * Generate the Cache ID for the LDAP query
     * 
     * @param Tinebase_Model_Filter_FilterGroup $_filter
     * @return string
     */
    protected function _getCacheId(Tinebase_Model_Filter_FilterGroup $_filter)
    {
       return convertCacheId('AddressbookBackendLdap' . sha1(print_r($this->_options, true) .print_r($_filter, true)));
    }
    
    /**
     * Decodes given Tine filter to LDAP functions
     * @param Tinebase_Model_Filter_FilterGroup $_filter
     * @return array
     */
    protected function _decodeFilter(Tinebase_Model_Filter_FilterGroup $_filter, Tinebase_Model_Pagination $_pagination)
    {
        $arrFilters = array();
        $filters = $_filter->getFilterObjects();
        foreach($filters as $filter)
        {
            $objClass = get_class($filter);
            switch ($objClass)
            {
                case 'Addressbook_Model_ContactFilter':
                    //look for the definition of the fields in the model of the filter
                    $filterModel = $filter->getFilterModel();
                    $addressBookFilters = $filter->getFilterObjects();
                    foreach ($addressBookFilters[0] as $adrFilter)
                    {
                        $value    = $adrFilter->getValue();
                        $field    = $adrFilter->getField();
                        $operator = $adrFilter->getOperator();
                        $arrFields = array();
                        switch ($field)
                        {
                            case 'container_id': //do nothing, container id is a sql only field
                                break;
                            default:
                                if (isset($filterModel[$field]['options']['fields']))
                                {
                                    foreach ($filterModel[$field]['options']['fields'] as $nField)
                                    {
                                        $arrFields[] = $this->_attributes[$nField];
                                    }
                                }
                                else
                                {
                                    $arrFields[] = $this->_attributes[$field];
                                }
                        }
                        $filter = '';
                        foreach ($arrFields as $field)
                        {
                            $filter .= $this->_generateLdapFilter($value, $field, $operator);
                        }
                        if (!(empty($filter)))
                        {
                            if (count($arrFields)>1)
                            {
                                $filter = '(|' . $filter. ')';
                            }
                            $arrFilters[] = $filter;
                        }
                    }
                   break;
            }
        }
        if (count($arrFilters) >= 1)
        {
            $filter = '(&(&'. implode('',$arrFilters) . ')' . $this->_options['filter'] . ')';
        }
        else
        {
            $filter = $this->_options['filter'];
        }
        Tinebase_Core::getLogger()->debug(__METHOD__ . '::' . __LINE__ . 'LDAP filter :' . $filter);
        $pagination = $_pagination->toArray();
        $return = array
        (
            'filter'    => $filter,
            'start'     => $pagination['start'],
            'limit'     => $pagination['limit'],
            'sort'      => $pagination['sort'],
            'dir'       => strtoupper($pagination['dir'])
        );
        return $return;
    }
    
    /**
     * Generates the LDAP filter for a given Attribute. If no attribute is given it generates the search by id
     * 
     * @param type $_value
     * @param type $_attribute
     * @return string 
     * @todo figure how to implemente the in operator
     */
    protected function _generateLdapFilter($_value, $_attribute = NULL, $_operator = 'equals')
    {
        $return = '';
        $attribute = $_attribute;
        if (is_null($attribute))
        {
            $attribute = $this->_attributes[self::IDCOL];
        }
        if ((!empty($_value)) && (!empty($attribute)))
        {
            switch ($_operator)
            {
                case 'contains'://something=*value*
                    $return = '(' . $attribute . '=*' . $_value .  '*)';
                    break;
                case 'equals'://something=value
                    $return = '(' . $attribute . '=' . $_value .  ')';
                    break;
                case 'startswith'://something=value*
                    $return = '(' . $attribute . '=' . $_value .  '*)';
                    break;
                case 'endswith'://something=*value
                    $return = '(' . $attribute . '=*' . $_value .  ')';
                    break;
                case 'not'://(!(uid=94813566049))
                    $return = '(!(' . $attribute . '=*' . $_value .  '*))';
                    break;
                case 'in'://(|(something=*value*)(something=*value*)(something=*value*)...)
                    $arrValues = explode(',', $_value);
                    $return = '';
                    foreach ($arrValues as $value)
                    {
                        $return .= $this->_generateLdapFilter(trim($value), $attribute, 'contains');
                    }
                    $return = '(|' . $return . ')';
                    break;
                default:
                    throw new Tinebase_Exception_NotImplemented('Operator Not Implemented');
            }
        }
        return $return;
    }
    
    /**
     * Generate the Atrribute Array for ldapsearch
     * @param mixed $_cols
     * @return array 
     */
    protected function _generateAttributesArray($_cols)
    {
        $return = array();
        if (($_cols === TRUE) ||($_cols == self::IDCOL))
        {
            $return = array(self::IDCOL);
        }
        elseif (($_cols == '*') || (empty($_cols)))
        {
            $return = array_values($this->_attributes);
        }
        else
        {
            $attr = explode(',', $_cols);
            foreach ($attr as $atrib)
            {
                $return[] = $this->_attributes[$atrib];
            }
        }        
        return $return;
    }
    
    /**
     * Update the attributes array based on configurations set on database 
     * 
     */
    protected function _updateAttributes()
    {
        $newAttributes = $this->_options['attributes'];
        $oldAttributes = $this->_attributes;
        
        foreach ($newAttributes as $key=>$value)
        {
            $oldAttributes[$key] = $value;
        }
        $this->_attributes = $oldAttributes;
    }
    
    /**
     *  Returns the max results for a ldap search
     * @return type 
     */
    protected function _getMaxResults()
    {
        $maxresults = $this->_options['maxResults'];
        if ($maxresults == 0)
        {
            $maxresults = self::DEFAULTMAXRESULTS;
        }
        return $maxresults;
    }
    
    /**
     * set contact image
     * 
     * @param array $_data
     * @TODO: implementation
     */
    protected function _setContactImage($data)
    {
        /*
        if (! isset($data['jpegphoto']) || $data['jpegphoto'] === '')
        {
            return;
        }
        $image = Tinebase_ImageHelper::getImageInfoFromBlob($data['jpegphoto']);
        
       //Tinebase_Core::getLogger()->alert(__METHOD__ . ':' . __LINE__ . ' _setContactImage '. print_r(array_keys($imageParams), true));
        
        
        if (Tinebase_Core::isLogLevel(Zend_Log::DEBUG)) Tinebase_Core::getLogger()->debug(__METHOD__ . '::' . __LINE__ . ' image params:' . print_r($imageParams, TRUE));
        if ($imageParams['isNewImage']) {
            try {
                $_data['jpegphoto'] = Tinebase_ImageHelper::getImageData($imageParams);
            } catch(Tinebase_Exception_UnexpectedValue $teuv) {
                Tinebase_Core::getLogger()->warn(__METHOD__ . '::' . __LINE__ . ' Could not add contact image: ' . $teuv->getMessage());
                unset($_data['jpegphoto']);
            }
        } else {
            unset($_data['jpegphoto']);
        }
        */
    }
}